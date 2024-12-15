package dev.amitwani.githubwrapped.service;

import dev.amitwani.githubwrapped.dto.StatsDTO;
import dev.amitwani.githubwrapped.dto.graphql.GitHubContributionStats;
import dev.amitwani.githubwrapped.dto.graphql.GitHubPinnedItems;
import dev.amitwani.githubwrapped.dto.graphql.GitHubRepositoryStats;
import dev.amitwani.githubwrapped.model.GitHubStats;
import dev.amitwani.githubwrapped.model.GitHubUser;
import dev.amitwani.githubwrapped.repository.GitHubStatsRepository;
import dev.amitwani.githubwrapped.repository.GitHubUserRepository;
import org.kohsuke.github.GHUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class StatsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(StatsService.class);

    @Autowired
    private GitHubService gitHubService;

    @Autowired
    private GitHubUserRepository gitHubUserRepository;

    @Autowired
    private GitHubStatsRepository gitHubStatsRepository;

    public void generateGitHubStats(String username) {
        try {

            if (gitHubUserRepository.existsByUsername(username)) {
                throw new RuntimeException("User " + username + " stats already exists");
            }
            // Fetch User Data from GitHub
            GHUser user = gitHubService.getGitHubUser(username);
            LOGGER.info("Fetched user data for user: {}", user);

            if (user == null) {
                throw new RuntimeException("User not found");
            }

            // Process User Data
            GitHubUser gitHubUser = new GitHubUser();
            gitHubUser.setBio(user.getBio());
            gitHubUser.setCompany(user.getCompany());
            gitHubUser.setEmail(user.getEmail());
            gitHubUser.setAvatarUrl(user.getAvatarUrl());
            gitHubUser.setBlogUrl(user.getBlog());
            gitHubUser.setFollowers(user.getFollowersCount());
            gitHubUser.setFollowing(user.getFollowingCount());
            gitHubUser.setPublicRepos(user.getPublicRepoCount());
            gitHubUser.setName(user.getName());
            gitHubUser.setTwitterUsername(user.getTwitterUsername());
            gitHubUser.setUsername(user.getLogin());

            LOGGER.info("Saved user data for user: {}", gitHubUser);

            // Get User Pinned Repos
            GitHubPinnedItems pinnedRepos = gitHubService.getPinnedRepos(username);
            LOGGER.info("Fetched pinned repos for user: {}", pinnedRepos);

            // Save Pinned Repos
            List<GitHubPinnedItems.Node> pinnedRepoNodes = pinnedRepos.getData().getUser().getPinnedItems().getEdges().stream().map(edge -> edge.getNode()).toList();

            for (GitHubPinnedItems.Node node : pinnedRepoNodes) {
                gitHubUser.getPinnedRepositories().add(new GitHubUser.PinnedRepositories(
                        node.getName(),
                        node.getDescription(),
                        node.getUrl(),
                        node.getStars(),
                        node.getForkCount(),
                        node.getPrimaryLanguage().getName(),
                        node.getPrimaryLanguage().getColor()
                ));
            }

            // Generate Stats
            GitHubStats gitHubStats = new GitHubStats();
            gitHubStats.setUsername(username);

            List<GitHubRepositoryStats.RepositoryNode> repositoryNodes = gitHubService.getRepositoryStats(username);

            // Languagges
            List<GitHubRepositoryStats.LanguageEdge> languageEdges = repositoryNodes
                    .stream()
                    .flatMap(node -> node.getLanguages().getEdges()
                            .stream()
                            .toList()
                            .stream())
                    .toList();


            Map<String, GitHubStats.LanguageStats> languageStatsMap = new HashMap<>();

            languageEdges.forEach(edge -> {
                if (languageStatsMap.containsKey(edge.getNode().getName())) {
                    GitHubStats.LanguageStats languageStats = languageStatsMap.get(edge.getNode().getName());
                    languageStats.setLinesCount(languageStats.getLinesCount() + edge.getSize());
                    return;
                }
                GitHubStats.LanguageStats languageStats = new GitHubStats.LanguageStats();
                languageStats.setLanguage(edge.getNode().getName());
                languageStats.setColor(edge.getNode().getColor());
                languageStats.setLinesCount(edge.getSize());
                languageStatsMap.put(edge.getNode().getName(), languageStats);
            });

            List<GitHubStats.LanguageStats> languageStats = languageStatsMap.values().stream()
                    .sorted(Comparator.comparing(GitHubStats.LanguageStats::getLinesCount).reversed())
                    .toList();

            gitHubStats.setLanguagesStats(languageStats);

            // Get Contribution Stats
            GitHubContributionStats contributionStats = gitHubService.getContributionStats(username);

            gitHubStats.setTotalCommits(contributionStats.getData().getUser().getContributionsCollection().getCommits());
            gitHubStats.setTotalIssuesClosed(contributionStats.getData().getUser().getContributionsCollection().getIssuesClosed());
            gitHubStats.setTotalPullRequestsClosed(contributionStats.getData().getUser().getContributionsCollection().getPullRequestsClosed());
            gitHubStats.setContributionCalendar(contributionStats.getData().getUser().getContributionsCollection().getContributionCalendar());

            // Top Repository
            GitHubStats.Repository topRepository = new GitHubStats.Repository();

            GitHubRepositoryStats.RepositoryNode topRepositoryNode = repositoryNodes.stream()
                    .max(Comparator.comparing(GitHubRepositoryStats.RepositoryNode::getStars))
                    .orElse(null);

            if (topRepositoryNode != null) {
                topRepository.setName(topRepositoryNode.getName());
                topRepository.setTopLanguage(topRepositoryNode.getPrimaryLanguage().getName());
                topRepository.setTopLanguageColor(topRepositoryNode.getPrimaryLanguage().getColor());
                topRepository.setStars(topRepositoryNode.getStars());
                topRepository.setForks(topRepositoryNode.getForkCount());
                gitHubStats.setTopRepository(topRepository);
            }

            // Save User Data
            gitHubUser.setCreatedDate(new Date());
            gitHubUser = gitHubUserRepository.save(gitHubUser);

            // Save Stats
            gitHubStats.setUserId(gitHubUser.getId());
            gitHubStats = gitHubStatsRepository.save(gitHubStats);

            LOGGER.info("Generated stats for user: {}", gitHubStats);


        } catch (Exception e) {
            LOGGER.error("Error generating stats for user: {}", username, e);
        }
    }

    public StatsDTO getStats(String username) {

        GitHubUser gitHubUser = gitHubUserRepository.findByUsername(username);
        if (gitHubUser == null) {
            return null;
        }

        StatsDTO statsDTO = new StatsDTO();
        statsDTO.setStats(gitHubStatsRepository.findByUsername(username));
        statsDTO.setUser(gitHubUser);
        statsDTO.setUsername(username);

        return statsDTO;
    }
}