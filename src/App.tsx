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

  const defaultText =
    "日本語は、日本国内や、かつての日本領だった国、そして国外移民や移住者を含む日本人同士の間で使用されている言語。日本は法令によって公用語を規定していないが、法令その他の公用文は全て日本語で記述され、各種法令において日本語を用いることが規定され、学校教育においては「国語」の教科として学習を行うなど、事実上日本国内において唯一の公用語となっている。";

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
      return languageTag; // Fallback to the language code if conversion fails
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Identifying language with the MediaPipe Language Detection Task
      </h1>

      <p className="mb-4">
        This demo detects the language of the input text. The result shows the
        most likely language using the{" "}
        <a
          href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ISO_639-1
        </a>{" "}
        language code.
      </p>

      <h2 className="text-xl font-bold mb-2">How to use</h2>
      <p className="mb-4">
        Add text to the input field, and then press <b>Detect Language</b>.
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

      <button
        onClick={handleDetectLanguage}
        disabled={!detector || isLoading}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mb-4 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isLoading ? "DETECTING..." : "DETECT LANGUAGE"}
      </button>

      <p className="font-bold mb-2">Result:</p>
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
  );
};

export default App;
