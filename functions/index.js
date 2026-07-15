const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// API Endpoint configurations
const GEMINI_VISION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const IMAGEN_GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict";

/**
 * HTTPS Callable: convertSketch
 * Secures Gemini/Imagen API Keys on the server-side, checks user auth and credits,
 * and calls Google Cloud GenAI endpoints on behalf of the desktop application.
 */
exports.convertSketch = onCall({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (request) => {
  // 1. Authenticate user session (JWT validation handled by Firebase Auth natively)
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "이 기능은 구글 로그인이 필요한 프리미엄 기능입니다."
    );
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email || "unknown@user.com";
  const userRef = db.collection("users").doc(uid);

  // 2. Fetch or initialize user credits
  let userDoc = await userRef.get();
  if (!userDoc.exists) {
    console.log(`[convertSketch] Creating new Firestore document for user: ${email} (UID: ${uid})`);
    // Give 10 free credits to newly registered users
    await userRef.set({
      email: email,
      credits: 10,
      isSubscribed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    userDoc = await userRef.get();
  }

  const userData = userDoc.data();
  const currentCredits = userData.credits || 0;

  // 3. Verify user has enough credits
  if (currentCredits < 1) {
    return {
      success: false,
      error: "잔여 크레딧이 부족합니다. 요금제 업그레이드 또는 크레딧을 구매해 주세요."
    };
  }

  // 4. Securely load GEMINI_API_KEY from environment variables
  // In Firebase, this is set via: firebase functions:secrets:set GEMINI_API_KEY="your_key"
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[convertSketch] GEMINI_API_KEY environment variable is not configured on the server!");
    return {
      success: false,
      error: "서버 API 키 설정 오류가 발생했습니다. 관리자에게 문의해 주세요."
    };
  }

  const { action, image, prompt } = request.data;

  try {
    if (action === "vision") {
      // --- Action A: Sketch Vision Classification (Gemini 2.5 Flash) ---
      console.log(`[convertSketch] User ${email} invoking Gemini Vision. Current credits: ${currentCredits}`);
      
      // Clean base64 prefix if present
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

      const payload = {
        contents: [
          {
            parts: [
              {
                text: "Look at this rough black-and-white presentation sketch drawing. Categorize the main shape. You MUST respond ONLY in the following format: 'KoreanName (EnglishNoun)'. For example, if it is a Heart, output '하트 (Heart)'. If it is a Star, output '별 (Star)'. If it is a Cloud, output '구름 (Cloud)'. If it is a Checkmark, output '체크 (Check)'. Output ONLY this string."
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: cleanBase64
                }
              }
            ]
          }
        ]
      };

      const response = await axios.post(`${GEMINI_VISION_URL}?key=${apiKey}`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      const textResult = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!textResult) {
        throw new Error("Gemini Vision API returned empty text result.");
      }

      // Deduct 1 credit from Firestore on success
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(-1)
      });

      console.log(`[convertSketch] Vision classification succeeded: "${textResult}". Credit deducted.`);
      return {
        success: true,
        data: textResult
      };

    } else if (action === "generate") {
      // --- Action B: Image Generation (Imagen 4.0) ---
      console.log(`[convertSketch] User ${email} invoking Imagen 4.0. Current credits: ${currentCredits}`);

      const payload = {
        instances: [
          { prompt: prompt }
        ],
        parameters: {
          sampleCount: 1,
          outputMimeType: "image/png",
          aspectRatio: "1:1"
        }
      };

      const response = await axios.post(`${IMAGEN_GENERATE_URL}?key=${apiKey}`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      const base64Bytes = response.data?.predictions?.[0]?.bytesBase64Encoded;
      if (!base64Bytes) {
        throw new Error("Imagen 4.0 API returned empty prediction bytes.");
      }

      const base64Url = `data:image/png;base64,${base64Bytes}`;

      // Deduct 1 credit from Firestore on success
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(-1)
      });

      console.log(`[convertSketch] Imagen 4.0 generation succeeded. Credit deducted.`);
      return {
        success: true,
        data: base64Url
      };

    } else {
      throw new HttpsError("invalid-argument", "지원하지 않는 액션 유형입니다.");
    }

  } catch (error) {
    console.error("[convertSketch] API Call or DB Update failed:", error.response?.data || error.message);
    return {
      success: false,
      error: `서버 통신 실패: ${error.message}`
    };
  }
});
