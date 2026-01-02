import { useState, useEffect } from 'react';
import { Search, Filter, Database, Code, Building2, Award } from 'lucide-react';

interface SearchResult {
  content: string;
  databases: string[];
  programming_languages: string[];
  companies: string[];
  certifications: string[];
  skills: string[];
  score: number;
}

interface Aggregations {
  databases: { name: string; count: number }[];
  programming_languages: { name: string; count: number }[];
  companies: { name: string; count: number }[];
  certifications: { name: string; count: number }[];
}

export default function FacetedSearchTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aggregations, setAggregations] = useState<Aggregations | null>(null);

  // Selected filters
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);

  // Load aggregations on mount
  useEffect(() => {
    const loadAggregations = async () => {
      try {
        const response = await fetch(
          'https://general-backend-production-a734.up.railway.app/elasticsearch/aggregations',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAggregations(data);
        }
      } catch (error) {
        console.error('Failed to load aggregations:', error);
      }
    };
    loadAggregations();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://general-backend-production-a734.up.railway.app/elasticsearch/faceted-search',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            databases: selectedDatabases,
            programming_languages: selectedLanguages,
            companies: selectedCompanies,
            certifications: selectedCertifications,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (category: string, value: string) => {
    const setters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
      databases: setSelectedDatabases,
      languages: setSelectedLanguages,
      companies: setSelectedCompanies,
      certifications: setSelectedCertifications,
    };

    const getters: Record<string, string[]> = {
      databases: selectedDatabases,
      languages: selectedLanguages,
      companies: selectedCompanies,
      certifications: selectedCertifications,
    };

    const setter = setters[category];
    const current = getters[category];

    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedDatabases([]);
    setSelectedLanguages([]);
    setSelectedCompanies([]);
    setSelectedCertifications([]);
  };

  const hasActiveFilters =
    selectedDatabases.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedCompanies.length > 0 ||
    selectedCertifications.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search your CV data..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900">Filters</h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Databases Filter */}
            {aggregations && aggregations.databases.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold text-gray-800">Databases</h4>
                </div>
                <div className="space-y-1">
                  {aggregations.databases.slice(0, 10).map((db) => (
                    <label key={db.name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedDatabases.includes(db.name)}
                        onChange={() => toggleFilter('databases', db.name)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{db.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">({db.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Programming Languages Filter */}
            {aggregations && aggregations.programming_languages.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-800">Languages</h4>
                </div>
                <div className="space-y-1">
                  {aggregations.programming_languages.slice(0, 10).map((lang) => (
                    <label key={lang.name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.name)}
                        onChange={() => toggleFilter('languages', lang.name)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{lang.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">({lang.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Companies Filter */}
            {aggregations && aggregations.companies.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <h4 className="font-semibold text-gray-800">Companies</h4>
                </div>
                <div className="space-y-1">
                  {aggregations.companies.slice(0, 10).map((company) => (
                    <label key={company.name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.name)}
                        onChange={() => toggleFilter('companies', company.name)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{company.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">({company.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications Filter */}
            {aggregations && aggregations.certifications.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <h4 className="font-semibold text-gray-800">Certifications</h4>
                </div>
                <div className="space-y-1">
                  {aggregations.certifications.slice(0, 10).map((cert) => (
                    <label key={cert.name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCertifications.includes(cert.name)}
                        onChange={() => toggleFilter('certifications', cert.name)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{cert.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">({cert.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Search Results {results.length > 0 && `(${results.length})`}
            </h3>

            {results.length === 0 && !loading && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  {hasActiveFilters || query
                    ? 'No results found. Try adjusting your filters or search query.'
                    : 'Enter a search query or select filters to find relevant information.'}
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Searching...</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <p className="text-gray-800 mb-3">{result.content}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {result.databases.map((db) => (
                        <span
                          key={db}
                          className="bg-purple-100 text-purple-800 px-2 py-1 rounded"
                        >
                          {db}
                        </span>
                      ))}
                      {result.programming_languages.map((lang) => (
                        <span
                          key={lang}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                        >
                          {lang}
                        </span>
                      ))}
                      {result.companies.map((company) => (
                        <span
                          key={company}
                          className="bg-teal-100 text-teal-800 px-2 py-1 rounded"
                        >
                          {company}
                        </span>
                      ))}
                      {result.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Score: {result.score.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
