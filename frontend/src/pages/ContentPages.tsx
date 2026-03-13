import React, { useState } from "react";
import { useData } from "../contexts/DataContext";
import { Header, Container, EmptyState, Grid } from "../components/layout/Layout";
import { Card, LoadingSpinner, Input } from "../components/ui/Button";
import { formatTimeAgo, parseTimeString } from "../utils/formatters";

export const NewsPage: React.FC = () => {
  const { state } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter news
  const filteredNews = state.news.filter((news) => {
    const matchesCategory = !selectedCategory || news.tg === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      news.t.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.s.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = Array.from(new Map(state.news.map(n => [n.tg, n])).keys());

  if (state.isLoading && state.news.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading news..." />
      </div>
    );
  }

  return (
    <>
      <Header
        title="News Feed"
        subtitle="Latest updates from Bittensor ecosystem"
      />

      <Container>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <Input
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="🔍"
          />

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("")}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${
                  !selectedCategory
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }
              `}
            >
              All News
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* News List */}
        {filteredNews.length > 0 ? (
          <div className="space-y-3">
            {filteredNews.map((news, index) => (
              <a
                key={index}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card hover className="p-4 block">
                  <div className="flex items-start gap-4">
                    {/* Icon based on category */}
                    <div className="text-2xl flex-shrink-0">
                      {news.tg === "Market" && "📈"}
                      {news.tg === "Subnet" && "🔗"}
                      {news.tg === "Protocol" && "⚙️"}
                      {news.tg === "Ecosystem" && "🌍"}
                      {news.tg === "Institutional" && "🏢"}
                      {news.tg === "Analysis" && "📊"}
                      {news.tg === "Analytics" && "📉"}
                      {news.tg === "Media" && "📻"}
                      {news.tg === "Community" && "👥"}
                      {news.tg === "Research" && "🔬"}
                      {!["Market", "Subnet", "Protocol", "Ecosystem", "Institutional", "Analysis", "Analytics", "Media", "Community", "Research"].includes(news.tg) && "📰"}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{news.t}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-semibold">
                              {news.tg}
                            </span>
                            <span>{news.s}</span>
                            <span className="text-gray-400">{news.tm}</span>
                          </div>
                        </div>
                        <div className="text-xl">↗</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📭"
            title="No news found"
            message={
              searchTerm || selectedCategory
                ? "Try adjusting your filters"
                : "No news available"
            }
          />
        )}
      </Container>
    </>
  );
};

export const ResearchPage: React.FC = () => {
  const { state } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const filteredResearch = state.research.filter(
    (article) =>
      !selectedCategory || article.c === selectedCategory
  );

  const categories = Array.from(
    new Set(state.research.map((r) => r.c))
  ).sort();

  return (
    <>
      <Header
        title="Research"
        subtitle="In-depth analysis on Bittensor and subnets"
      />

      <Container>
        {/* Category Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory("")}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                !selectedCategory
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }
            `}
          >
            All Articles
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {filteredResearch.length > 0 ? (
          <Grid columns={2} gap="lg">
            {filteredResearch.map((article, index) => (
              <Card key={index} hover className="overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="text-4xl mb-3">{article.i}</div>
                  <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold mb-3">
                    {article.c}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{article.t}</h3>
                  <p className="text-gray-600 text-sm mb-4">{article.ex}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{article.d}</span>
                  </div>
                </div>
              </Card>
            ))}
          </Grid>
        ) : (
          <EmptyState
            icon="📭"
            title="No articles found"
            message="Check back soon for more research"
          />
        )}
      </Container>
    </>
  );
};

export const LessonsPage: React.FC = () => {
  const { state } = useData();
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const filteredLessons = state.lessons.filter(
    (lesson) =>
      !selectedLevel || lesson.level === selectedLevel
  );

  const levels = ["beginner", "intermediate", "advanced"];

  return (
    <>
      <Header
        title="Education"
        subtitle="Learn about Bittensor and the decentralized AI economy"
      />

      <Container>
        {/* Level Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedLevel("")}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                !selectedLevel
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }
            `}
          >
            All Levels
          </button>
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize
                ${
                  selectedLevel === level
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Lessons Grid */}
        {filteredLessons.length > 0 ? (
          <Grid columns={3} gap="md">
            {filteredLessons.map((lesson) => (
              <Card key={lesson.id} hover className="overflow-hidden flex flex-col p-6">
                <div className="mb-3">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                    style={{
                      backgroundColor: lesson.level === "beginner" ? "#D1FAE5" : lesson.level === "intermediate" ? "#FEF3C7" : "#FED7AA",
                      color: lesson.level === "beginner" ? "#065F46" : lesson.level === "intermediate" ? "#92400E" : "#92400E",
                    }}>
                    {lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{lesson.title}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-1">{lesson.category}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>⏱ {lesson.duration} min</span>
                </div>
              </Card>
            ))}
          </Grid>
        ) : (
          <EmptyState
            icon="📚"
            title="No lessons found"
            message="Check back soon for more educational content"
          />
        )}
      </Container>
    </>
  );
};
