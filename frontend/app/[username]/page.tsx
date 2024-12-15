import {
  ContributionCalendar,
  ContributionDay as ContributionDayType,
  StatsResponse,
  Week,
} from "@/types/stats";
import Image from "next/image";
import Link from "next/link";

const getStats = async (username: string) => {
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/stats/${username}`,
      {
        headers: {
          Authorization: `${process.env.BACKEND_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
  return null;
};

function ContributionDay({ day }: { day: ContributionDayType }) {
  return (
    <div
      className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm text-white/[0.08]"
      style={{ backgroundColor: day.color || "#161b22" }}
      title={`${day.contributionCount} contributions on ${day.date}`}
    />
  );
}

function ContributionGraph({ calendar }: { calendar: ContributionCalendar }) {
  return (
    <div className="bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-lg p-4 md:p-6 overflow-x-auto">
      <h2 className="text-lg md:text-xl font-semibold mb-4">
        Contribution Graph (2024)
      </h2>
      <div className="flex flex-col gap-2 min-w-[750px] md:min-w-0">
        <div className="grid grid-cols-[repeat(53,1fr)] gap-[2px] md:gap-1">
          {calendar.weeks.map((week: Week, weekIndex: number) => (
            <div key={weekIndex} className="flex flex-col gap-[2px] md:gap-1">
              {week.contributionDays.map(
                (day: ContributionDayType, dayIndex: number) => (
                  <ContributionDay key={dayIndex} day={day} />
                )
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 text-xs md:text-sm text-muted-foreground mt-2">
          <span>More</span>
          <div className="flex gap-[2px] md:gap-1">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm bg-[#161b22]" />
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm bg-[#0e4429]" />
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm bg-[#006d32]" />
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm bg-[#26a641]" />
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm bg-[#39d353]" />
          </div>
          <span>Less</span>
        </div>
      </div>
    </div>
  );
}

export default async function GitHubWrapped({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;
  const stats: StatsResponse = await getStats(username);

  if (!stats?.data) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-8">
        <h1 className="text-white text-center text-2xl md:text-3xl">
          No GitHub Wrapped found for
        </h1>
        <p className="text-white font-bold text-base md:text-lg mt-4">
          {username}
        </p>
        <Link
          className="text-white text-base font-semibold md:text-lg mt-8 underline"
          href={`/`}
        >
          Generate your GitHub Wrapped
        </Link>
      </div>
    );
  }

  const { user, stats: githubStats } = stats.data;

  return (
    <div className="container text-white mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-lg p-6 mb-8 ">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Image
            src={user.avatarUrl}
            alt={user.username || ""}
            width={120}
            height={120}
            className="rounded-full"
          />
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2">{user.name || username}</h1>
            {user.bio && (
              <p className="text-muted-foreground mb-4">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.followers}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.following}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.publicRepos}</span>
                <span className="text-muted-foreground">Repositories</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Graph */}
      <ContributionGraph calendar={githubStats.contributionCalendar} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Contribution Stats */}
        <div className="bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contributions (2024)</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Commits</span>
              <span className="font-semibold">{githubStats.totalCommits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issues Closed</span>
              <span className="font-semibold">
                {githubStats.totalIssuesClosed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PRs Merged</span>
              <span className="font-semibold">
                {githubStats.totalPullRequestsClosed}
              </span>
            </div>
          </div>
        </div>

        {/* Repository Stats */}
        <div className="bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Repository Impact</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Stars</span>
              <span className="font-semibold">{githubStats.totalStars}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Forks</span>
              <span className="font-semibold">{githubStats.totalForks}</span>
            </div>
          </div>
        </div>

        {/* Top Languages */}
        <div className="bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Languages</h2>
          <div className="space-y-3">
            {githubStats.languagesStats.slice(0, 5).map((lang) => (
              <div key={lang.language} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: lang.color || "#666" }}
                />
                <span className="text-muted-foreground">{lang.language}</span>
                <span className="text-sm ml-auto">
                  {(
                    ((lang.linesCount || 0) /
                      githubStats.languagesStats.reduce(
                        (acc, curr) => acc + (curr.linesCount || 0),
                        0
                      )) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pinned Repositories */}
      {user.pinnedRepositories.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Pinned Repositories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.pinnedRepositories.map((repo) => (
              <a
                key={repo.name}
                href={repo.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-lg p-6 hover:bg-black/60 transition-all"
              >
                <h3 className="font-semibold mb-2">{repo.name}</h3>
                {repo.description && (
                  <p className="text-muted-foreground text-sm mb-4">
                    {repo.description}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  {repo.topLanguage && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: repo.topLanguageColor || "#666",
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {repo.topLanguage}
                      </span>
                    </div>
                  )}
                  {repo.stars && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">
                        ⭐ {repo.stars}
                      </span>
                    </div>
                  )}
                  {repo.forkCount && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">
                        🍴 {repo.forkCount}
                      </span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
