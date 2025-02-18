import {
  LanguageDetector,
  LanguageDetectorPrediction,
} from "@mediapipe/tasks-text";
import React, { useState, useEffect } from "react";

interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

interface Translator {
  translate: (text: string) => Promise<string>;
}

const App = () => {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<LanguageDetectorPrediction[]>([]);
  const [detector, setDetector] = useState<LanguageDetector | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Translation states
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [translator, setTranslator] = useState<Translator | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const defaultText =
    "日本語は、日本国内や、かつての日本領だった国、そして国外移民や移住者を含む日本人同士の間で使用されている言語。日本は法令によって公用語を規定していないが、法令その他の公用文は全て日本語で記述され、各種法令において日本語を用いることが規定され、学校教育においては「国語」の教科として学習を行うなど、事実上日本国内において唯一の公用語となっている。";

  const supportedLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "ja", name: "Japanese" },
    { code: "fr", name: "French" },
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

  // Initialize translator when target language changes
  useEffect(() => {
    const initializeTranslator = async () => {
      if (!result.length) return; // Wait for language detection

      const sourceLanguage = result[0].languageCode;

      setTranslationError(null);
      setIsDownloading(true);
      setDownloadProgress(null);

      try {
        const translatorCapabilities = await (
          window as any
        ).ai.translator.capabilities();
        const status = await translatorCapabilities.languagePairAvailable(
          sourceLanguage,
          targetLanguage
        );

        if (status === "after-download") {
          const newTranslator = await (window as any).ai.translator.create({
            sourceLanguage,
            targetLanguage,
            monitor(m: any) {
              m.addEventListener(
                "downloadprogress",
                (e: DownloadProgressEvent) => {
                  setDownloadProgress({
                    loaded: e.loaded,
                    total: e.total,
                  });
                }
              );
            },
          });

          setTranslator(newTranslator);
          setTranslationError(null);
        }
      } catch (err) {
        setTranslationError("Failed to initialize translator.");
        console.error("Translation initialization error:", err);
      } finally {
        setIsDownloading(false);
      }
    };

    initializeTranslator();
  }, [result, targetLanguage]);

  const handlePopulateText = () => {
    setInputText(defaultText);
    setTranslatedText("");
    setResult([]);
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
    setTranslatedText("");

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
    if (!translator) {
      setTranslationError(
        "Translator is not ready. Please wait for initialization."
      );
      return;
    }

    setTranslationError(null);
    try {
      const result = await translator.translate(inputText.trim());
      setTranslatedText(result);
    } catch (err) {
      setTranslationError("Translation failed. Please try again.");
      console.error("Translation error:", err);
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Language Detection and Translation
      </h1>

      <p className="mb-4">
        This demo detects the language of the input text and can translate it to
        your chosen language.
      </p>

      <div className="mb-4">
        <button
          onClick={handlePopulateText}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          POPULATE TEXT
        </button>
      </div>

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

        {result.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isDownloading}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleTranslate}
              disabled={isDownloading || !translator}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isDownloading ? "PREPARING..." : "TRANSLATE"}
            </button>
          </div>
        )}
      </div>

      {/* Download Progress */}
      {isDownloading && downloadProgress && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            Downloading language model: {formatBytes(downloadProgress.loaded)} /{" "}
            {formatBytes(downloadProgress.total)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (downloadProgress.loaded / downloadProgress.total) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Detection Results */}
      <div className="mb-6">
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
            <p>No language detected</p>
          )}
        </div>
      </div>

      {/* Translation Error */}
      {translationError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {translationError}
        </div>
      )}

      {/* Translation Results */}
      {translatedText && (
        <div className="mb-6">
          <p className="font-bold mb-2">Translation:</p>
          <div className="bg-gray-100 p-3 rounded">{translatedText}</div>
        </div>
      )}
    </div>
  );
};

export default App;
