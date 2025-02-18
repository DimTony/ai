import React, { useState, useEffect } from "react";

interface Translator {
  translate: (text: string) => Promise<string>;
}

interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

const App = () => {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("es");
  const [targetLanguage, setTargetLanguage] = useState("fr");
  const [translator, setTranslator] = useState<Translator | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supportedLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "ja", name: "Japanese" },
  ];

  const initializeTranslator = async () => {
    setError(null);
    setIsDownloading(true);
    setDownloadProgress(null);

    try {
      const newTranslator = await (window as any).ai.translator.create({
        sourceLanguage,
        targetLanguage,
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: DownloadProgressEvent) => {
            setDownloadProgress({
              loaded: e.loaded,
              total: e.total,
            });
          });
        },
      });

      setTranslator(newTranslator);
      setError(null);
    } catch (err) {
      setError("Failed to initialize translator. Please try again.");
      console.error("Translation initialization error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    // Check if selected language pair requires downloading
    const checkCapabilities = async () => {
      try {
        const translatorCapabilities = await (
          window as any
        ).ai.translator.capabilities();
        const status = await translatorCapabilities.languagePairAvailable(
          sourceLanguage,
          targetLanguage
        );

        if (status === "after-download") {
          initializeTranslator();
        }
      } catch (err) {
        setError("Failed to check translation capabilities.");
        console.error("Capabilities check error:", err);
      }
    };

    checkCapabilities();
  }, [sourceLanguage, targetLanguage]);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError("Please enter text to translate");
      return;
    }

    if (!translator) {
      setError("Translator is not ready. Please wait for initialization.");
      return;
    }

    setError(null);
    try {
      const result = await translator.translate(inputText.trim());
      setTranslatedText(result);
    } catch (err) {
      setError("Translation failed. Please try again.");
      console.error("Translation error:", err);
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI Browser Translation</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">From:</label>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isDownloading}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">To:</label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isDownloading}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      <div className="mb-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate"
          className="w-full h-32 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isDownloading}
        />
      </div>

      <button
        onClick={handleTranslate}
        disabled={isDownloading || !translator || !inputText.trim()}
        className="w-full bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
      >
        {isDownloading ? "Downloading Language Model..." : "Translate"}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {translatedText && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Translation:</h2>
          <div className="p-3 bg-gray-100 rounded">{translatedText}</div>
        </div>
      )}
    </div>
  );
};

export default App;
