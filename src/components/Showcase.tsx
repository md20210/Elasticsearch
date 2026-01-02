import { useState } from 'react';
import ComparisonTab from './ComparisonTab';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Showcase() {
  const [currentScreenshot, setCurrentScreenshot] = useState(0);

  const screenshots = [
    { src: '/Anwendung1.jpg', title: 'Application View 1 - Comparison Results', description: 'Side-by-side comparison of pgvector and Elasticsearch results with LLM evaluation' },
    { src: '/Anwendung2.jpg', title: 'Application View 2 - Search Interface', description: 'Query interface showing real-time comparison' },
    { src: '/Anwendung3.jpg', title: 'Application View 3 - Analytics', description: 'Analytics dashboard with performance metrics' },
    { src: '/Architektur1.jpg', title: 'Architecture Diagram 1', description: 'System architecture showing frontend, backend, and database layers' },
    { src: '/Architektur2.jpg', title: 'Architecture Diagram 2', description: 'Detailed component architecture' },
  ];

  const nextScreenshot = () => {
    setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
  };

  const prevScreenshot = () => {
    setCurrentScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Screenshots Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Screenshots & Architecture</h3>
          </div>

          <div className="relative">
            {/* Screenshot Display */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
              <img
                src={screenshots[currentScreenshot].src}
                alt={screenshots[currentScreenshot].title}
                className="w-full h-auto"
                style={{ maxHeight: '600px', objectFit: 'contain' }}
              />

              {/* Navigation Arrows */}
              <button
                onClick={prevScreenshot}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition"
                aria-label="Previous screenshot"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={nextScreenshot}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition"
                aria-label="Next screenshot"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Screenshot Info */}
            <div className="mt-4 text-center">
              <h4 className="font-semibold text-gray-900">{screenshots[currentScreenshot].title}</h4>
              <p className="text-sm text-gray-600 mt-1">{screenshots[currentScreenshot].description}</p>
              <p className="text-xs text-gray-500 mt-2">
                {currentScreenshot + 1} / {screenshots.length}
              </p>
            </div>

            {/* Thumbnail Navigation */}
            <div className="flex justify-center space-x-2 mt-4 overflow-x-auto pb-2">
              {screenshots.map((screenshot, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentScreenshot(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition ${
                    currentScreenshot === index
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <img
                    src={screenshot.src}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Tab */}
        <ComparisonTab />
      </div>
    </div>
  );
}
