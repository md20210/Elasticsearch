import { ArrowRight, FileText, Cpu, Database, CheckCircle } from 'lucide-react';

export default function LogstashPipelineTab() {
  const pipelineSteps = [
    {
      stage: 'Input',
      icon: FileText,
      title: 'CV Data Ingestion',
      description: 'User uploads CV text, cover letter, and URLs',
      details: ['Text parsing from PDF/DOCX', 'URL crawling for portfolio/LinkedIn', 'Character encoding normalization'],
      color: 'blue',
    },
    {
      stage: 'Filter',
      icon: Cpu,
      title: 'LLM Entity Extraction',
      description: 'Extract structured entities using Grok/Local LLM',
      details: [
        'Databases: PostgreSQL, MongoDB, Redis, etc.',
        'Programming Languages: Python, TypeScript, Java, etc.',
        'Companies: IBM, Cognizant, Accenture, etc.',
        'Certifications: AWS, Azure, Google Cloud, etc.',
        'Skills: Docker, Kubernetes, FastAPI, React, etc.',
      ],
      color: 'purple',
    },
    {
      stage: 'Transform',
      icon: Cpu,
      title: 'Text Chunking & Embedding',
      description: 'Split into semantic chunks and generate embeddings',
      details: ['800-character chunks with 150-char overlap', 'nomic-embed-text (768 dims) via Ollama', 'Preserve entity context in each chunk'],
      color: 'green',
    },
    {
      stage: 'Output - pgvector',
      icon: Database,
      title: 'PostgreSQL with pgvector',
      description: 'Store in PostgreSQL with vector search',
      details: ['Pure vector similarity search', 'Cosine similarity matching', 'PostgreSQL-native storage'],
      color: 'teal',
    },
    {
      stage: 'Output - Elasticsearch',
      icon: Database,
      title: 'Elasticsearch Hybrid Index',
      description: 'Store in Elasticsearch with hybrid capabilities',
      details: [
        'BM25 keyword search + kNN vector search',
        'Reciprocal Rank Fusion (RRF)',
        'Field boosting: databases^5, languages^4, companies^3',
        'Fuzzy matching and synonym expansion',
      ],
      color: 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Logstash-Style Data Pipeline</h2>
        <p className="text-gray-700">
          This visualization shows how CV data flows through our processing pipeline, similar to a Logstash data flow.
          Each stage transforms and enriches the data before indexing into vector databases.
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div className="space-y-6">
        {pipelineSteps.map((step, index) => (
          <div key={index}>
            <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${step.color}-600`}>
              <div className="flex items-start space-x-4">
                <div className={`bg-${step.color}-100 p-3 rounded-lg`}>
                  <step.icon className={`w-8 h-8 text-${step.color}-600`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider text-${step.color}-600`}>
                      {step.stage}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-700 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {index < pipelineSteps.length - 1 && (
              <div className="flex justify-center py-4">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Pipeline Output Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Feature</th>
                <th className="text-left py-3 px-4 font-semibold text-teal-700">pgvector</th>
                <th className="text-left py-3 px-4 font-semibold text-yellow-700">Elasticsearch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4 text-gray-800 font-medium">Search Method</td>
                <td className="py-3 px-4 text-gray-700">Pure Vector Similarity (kNN)</td>
                <td className="py-3 px-4 text-gray-700">Hybrid: BM25 + kNN with RRF</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-800 font-medium">Best For</td>
                <td className="py-3 px-4 text-gray-700">Semantic similarity search</td>
                <td className="py-3 px-4 text-gray-700">Multi-faceted search with filters</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-800 font-medium">Field Boosting</td>
                <td className="py-3 px-4 text-gray-700">Not supported</td>
                <td className="py-3 px-4 text-gray-700">✅ databases^5, languages^4, companies^3</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-800 font-medium">Fuzzy Matching</td>
                <td className="py-3 px-4 text-gray-700">Not supported</td>
                <td className="py-3 px-4 text-gray-700">✅ "Pytohn" finds "Python"</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-800 font-medium">Aggregations</td>
                <td className="py-3 px-4 text-gray-700">Manual SQL queries</td>
                <td className="py-3 px-4 text-gray-700">✅ Built-in term aggregations, histograms</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-800 font-medium">Scaling</td>
                <td className="py-3 px-4 text-gray-700">PostgreSQL vertical scaling</td>
                <td className="py-3 px-4 text-gray-700">✅ Horizontal sharding, replication</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-800 font-medium">Analytics</td>
                <td className="py-3 px-4 text-gray-700">Custom dashboards needed</td>
                <td className="py-3 px-4 text-gray-700">✅ Kibana integration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-World Use Cases */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-teal-50 rounded-xl shadow-md p-6 border border-teal-200">
          <h3 className="text-lg font-bold text-teal-900 mb-3">When to Use pgvector</h3>
          <ul className="space-y-2 text-sm text-teal-800">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <span>Pure semantic search without keyword matching</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <span>Already using PostgreSQL in your stack</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <span>GDPR compliance with on-premise data storage</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <span>Simpler infrastructure, lower operational cost</span>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 rounded-xl shadow-md p-6 border border-yellow-200">
          <h3 className="text-lg font-bold text-yellow-900 mb-3">When to Use Elasticsearch</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Need both keyword and semantic search (hybrid)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Faceted search with multiple filters</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Advanced analytics and aggregations (Kibana)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Large-scale production deployments (millions of docs)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Fuzzy matching, synonyms, typo tolerance</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">About Logstash</h3>
        <p className="text-sm text-blue-800 mb-3">
          While we don't use actual Logstash in this showcase, the data processing pipeline follows the same Input →
          Filter → Output pattern that Logstash provides. In production, Logstash would handle:
        </p>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Multi-source data ingestion (files, databases, APIs)</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Real-time data transformation and enrichment</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Output to multiple destinations (Elasticsearch, S3, etc.)</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Built-in monitoring and error handling</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
