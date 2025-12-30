import { Database, Construction } from 'lucide-react';

export default function ResultsElastic() {
  return (
    <div className="bg-white rounded-xl shadow-md p-12 text-center">
      <Construction className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        <Database className="w-6 h-6 inline-block mr-2" />
        Elasticsearch Results
      </h3>
      <p className="text-gray-600 mb-4">
        This feature is coming soon. Elasticsearch integration will be implemented in the next phase.
      </p>
      <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-gray-700 rounded-lg">
        Under Development
      </div>
    </div>
  );
}
