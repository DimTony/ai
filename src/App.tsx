import {
  LanguageDetector,
  LanguageDetectorPrediction,
} from "@mediapipe/tasks-text";
import React, { useState, useEffect } from "react";

const App = () => {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<LanguageDetectorPrediction[]>([]);
  const [detector, setDetector] = useState<LanguageDetector | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [isTranslating, setIsTranslating] = useState(false);

  const defaultText =
    "日本語は、日本国内や、かつての日本領だった国、そして国外移民や移住者を含む日本人同士の間で使用されている言語。日本は法令によって公用語を規定していないが、法令その他の公用文は全て日本語で記述され、各種法令において日本語を用いることが規定され、学校教育においては「国語」の教科として学習を行うなど、事実上日本国内において唯一の公用語となっている。";

  const supportedLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "ja", name: "Japanese" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese (Simplified)" },
  ];

  // Function to convert language code to human-readable name
  const languageTagToHumanReadable = (
    languageTag: string,
    targetLanguage = "en"
  ) => {
    try {
      const displayNames = new Intl.DisplayNames([targetLanguage], {
        type: "language",
      });
      return displayNames.of(languageTag);
    } catch (error) {
      console.error("Error converting language tag:", error);
      return languageTag;
    }
  };

  // Initialize the language detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        const { LanguageDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-text"
        );

        const text = await FilesetResolver.forTextTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0/wasm"
        );

        const languageDetector = await LanguageDetector.createFromOptions(
          text,
          {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/language_detector/language_detector/float32/1/language_detector.tflite`,
            },
            maxResults: 5,
          }
        );

        setDetector(languageDetector);
      } catch (error) {
        console.error("Error initializing language detector:", error);
      }
    };

    initializeDetector();
  }, []);

  const handlePopulateText = () => {
    setInputText(defaultText);
    setTranslatedText("");
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleDetectLanguage = async () => {
    if (!inputText) {
      alert("Please write some text, or click 'Populate text' to add text");
      return;
    }

    if (!detector) {
      alert(
        "Language detector is still initializing. Please try again in a moment."
      );
      return;
    }

    setIsLoading(true);
    setResult([]);

    try {
      await sleep(5);
      const detectionResult = await detector.detect(inputText);
      setResult(detectionResult.languages);
    } catch (error) {
      console.error("Error detecting language:", error);
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText) {
      alert("Please enter text to translate");
      return;
    }

    setIsTranslating(true);
    setTranslatedText("");

    try {
      // You'll need to replace this URL with your actual Google Cloud Translation API endpoint
      // and include your API key
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: inputText,
            target: targetLanguage,
            format: "text",
          }),
        }
      );

      const data = await response.json();

      if (data.data && data.data.translations) {
        setTranslatedText(data.data.translations[0].translatedText);
      } else {
        throw new Error("Translation failed");
      }
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("Error: Could not translate text");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Language Detection and Translation
      </h1>

      <p className="mb-4">
        This demo detects and translates text using{" "}
        <a
          href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ISO_639-1
        </a>{" "}
        language codes.
      </p>

      <h2 className="text-xl font-bold mb-2">How to use</h2>
      <p className="mb-4">
        Add text to the input field, then press <b>Detect Language</b> or{" "}
        <b>Translate</b>.
      </p>

      <p className="mb-4">
        You can{" "}
        <button
          onClick={handlePopulateText}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          POPULATE TEXT
        </button>{" "}
        with a default input, or add your own text.
      </p>

      <p className="font-bold mb-2">Input:</p>
      <div className="mb-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={8}
          cols={40}
          aria-label="Text Input"
        />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleDetectLanguage}
          disabled={!detector || isLoading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "DETECTING..." : "DETECT LANGUAGE"}
        </button>

        <div className="flex items-center gap-2">
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleTranslate}
            disabled={isTranslating || !inputText}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {isTranslating ? "TRANSLATING..." : "TRANSLATE"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Detection Results */}
        <div>
          <p className="font-bold mb-2">Detection Result:</p>
          <div className="min-h-6">
            {isLoading && <p>Detecting language...</p>}
            {!isLoading && result.length > 0 && (
              <div className="space-y-2">
                {result.map((language, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded">
                    <div className="font-medium">
                      {languageTagToHumanReadable(language.languageCode)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Confidence: {(language.probability * 100).toFixed(1)}%
                      <span className="ml-2 text-gray-400">
                        (Code: {language.languageCode})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && result.length === 0 && inputText && (
              <p>Result is empty</p>
            )}
          </div>
        </div>

        {/* Translation Results */}
        <div>
          <p className="font-bold mb-2">Translation:</p>
          <div className="min-h-6">
            {isTranslating && <p>Translating...</p>}
            {!isTranslating && translatedText && (
              <div className="bg-gray-100 p-3 rounded">
                <p>{translatedText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
