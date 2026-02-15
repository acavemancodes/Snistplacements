(function forumBootstrap() {
  const POSTS_KEY = 'snist-forum-posts-v1';
  const COMMENTS_KEY = 'snist-forum-comments-v1';
  const PROFILES_KEY = 'snist-forum-profiles-v1';
  const FORUM_PAGE_SIZE = 8;

  const CATEGORY_META = {
    devworms: {
      label: 'Dev Worms',
      badge: 'Project',
      defaultMode: 'project',
      description: 'Projects, dev logs, and collaboration threads.'
    },
    dsaworms: {
      label: 'DSA Worms',
      badge: 'DSA',
      defaultMode: 'discussion',
      description: 'Approaches, complexity discussion, and debug help.'
    },
    snistnews: {
      label: 'SNIST News',
      badge: 'News',
      defaultMode: 'discussion',
      description: 'Campus updates, drives, and important deadlines.'
    },
    partychat: {
      label: 'PartyChat',
      badge: 'Community',
      defaultMode: 'discussion',
      description: 'Casual but moderated student community threads.'
    }
  };

  const state = {
    posts: [],
    comments: [],
    profiles: {},
    view: {}
  };

  const refsByCategory = new Map();
  const ui = {
    postModal: null,
    postForm: null,
    profileModal: null,
    profileForm: null,
    projectFields: null,
    toastHost: null
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function safe(text = '') {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function toAgo(iso) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 'just now';
    const sec = Math.max(1, Math.floor((Date.now() - then) / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function parseCsvTags(value = '') {
    return [...new Set(
      String(value)
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)
    )].slice(0, 10);
  }

  function score(votes = {}) {
    return Object.values(votes).reduce((sum, vote) => sum + Number(vote || 0), 0);
  }

  function currentUser() {
    return window.auth?.currentUser || null;
  }

  function userKeyFrom(user) {
    return String(user?.email || '').trim().toLowerCase();
  }

  function sameUser(emailA, emailB) {
    return String(emailA || '').trim().toLowerCase() === String(emailB || '').trim().toLowerCase();
  }

  function requireAuth(message = 'Please log in to continue.') {
    const user = currentUser();
    if (user) return user;
    toast(message, 'warn');
    if (window.auth?.openModal) window.auth.openModal('loginModal');
    return null;
  }

  function deriveNameFromEmail(email = '') {
    const base = email.split('@')[0] || 'student';
    return base
      .split(/[._-]/g)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
  }

  function createDefaultUsername(seedName = '', taken = new Set()) {
    const seed = (seedName || 'student')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 18) || 'student';
    if (!taken.has(seed)) return seed;
    let i = 2;
    while (taken.has(`${seed}${i}`)) i += 1;
    return `${seed}${i}`;
  }

  function ensureProfile(user) {
    const key = userKeyFrom(user);
    if (!key) return null;
    if (state.profiles[key]) return state.profiles[key];

    const name = user.name || deriveNameFromEmail(user.email);
    const taken = new Set(Object.values(state.profiles).map((profile) => String(profile.username || '').toLowerCase()));
    const username = createDefaultUsername(name, taken);

    const profile = {
      name,
      username,
      branch: '',
      year: '',
      skills: [],
      github: '',
      bio: ''
    };

    state.profiles[key] = profile;
    writeJson(PROFILES_KEY, state.profiles);
    return profile;
  }

  function profileFor(email, fallbackName = 'SNIST User') {
    const key = String(email || '').toLowerCase();
    const profile = state.profiles[key];
    if (profile) return profile;
    return {
      name: fallbackName,
      username: key ? key.split('@')[0] : 'guest',
      branch: '',
      year: '',
      skills: [],
      github: '',
      bio: ''
    };
  }

  function voteEntity(votes = {}, userEmail, direction) {
    const key = String(userEmail || '').toLowerCase();
    const next = { ...votes };
    if (!key) return next;
    if (next[key] === direction) {
      delete next[key];
    } else {
      next[key] = direction;
    }
    return next;
  }

  function seedPosts() {
    const now = Date.now();
    const mk = (id, category, mode, title, body, tags, authorName, authorEmail, ageHours, extra = {}) => ({
      id,
      category,
      mode,
      title,
      body,
      tags,
      techStack: extra.techStack || [],
      github: extra.github || '',
      demo: extra.demo || '',
      screenshot: extra.screenshot || '',
      helpNeeded: Boolean(extra.helpNeeded),
      authorName,
      authorEmail,
      createdAt: new Date(now - ageHours * 3600000).toISOString(),
      votes: {},
      reports: 0,
      pinned: Boolean(extra.pinned)
    });

    return [
      mk(
        'seed_dev_1',
        'devworms',
        'project',
        'Campus Lost & Found Platform (MVP)',
        'Built a React + Node prototype to report lost items with status updates and image proofs.',
        ['react', 'node', 'campus'],
        'Aditya Sharma',
        'aditya@snist.edu',
        6,
        {
          github: 'https://github.com/example/lost-found',
          demo: 'https://lost-found-demo.example.com',
          techStack: ['react', 'express', 'mongodb'],
          helpNeeded: true
        }
      ),
      mk(
        'seed_dev_2',
        'devworms',
        'project',
        'Placement Prep Tracker',
        'Personal dashboard for deadlines, applied status, and interview checklist with reminders.',
        ['productivity', 'javascript', 'placements'],
        'Megha K',
        'megha@snist.edu',
        18,
        {
          github: 'https://github.com/example/prep-tracker',
          techStack: ['javascript', 'localstorage', 'css']
        }
      ),
      mk(
        'seed_dsa_1',
        'dsaworms',
        'discussion',
        'Sliding Window: fixed vs dynamic window cheat-sheet',
        'Can someone review this template for variable-length sliding window problems and edge cases?',
        ['sliding-window', 'arrays', 'templates'],
        'Rahul Reddy',
        'rahul@snist.edu',
        4
      ),
      mk(
        'seed_dsa_2',
        'dsaworms',
        'discussion',
        'DP memoization mistakes in knapsack variants',
        'I keep messing up state transitions when constraints include limited picks. Need guidance.',
        ['dp', 'knapsack', 'recursion'],
        'Nikhil Reddy',
        'nikhil@snist.edu',
        28
      ),
      mk(
        'seed_news_1',
        'snistnews',
        'discussion',
        'Off-campus drive: Data Engineer Intern (Deadline Friday)',
        'Eligibility, application process, and preparation resources collected in one thread.',
        ['placements', 'deadline', 'internship'],
        'Placement Cell',
        'placementcell@snist.edu',
        2,
        { pinned: true }
      ),
      mk(
        'seed_news_2',
        'snistnews',
        'discussion',
        'Hackathon registration now open for all branches',
        'Team formation support and rules summary posted here. Add your team in comments.',
        ['hackathon', 'events', 'campus'],
        'SNIST Community',
        'community@snist.edu',
        24
      ),
      mk(
        'seed_party_1',
        'partychat',
        'discussion',
        'Show your workstation setup',
        'Drop a picture link + one thing that improved your productivity this semester.',
        ['casual', 'setup', 'community'],
        'Ananya Reddy',
        'ananya@snist.edu',
        8
      ),
      mk(
        'seed_party_2',
        'partychat',
        'discussion',
        'Weekend build sprint check-in',
        'What are you shipping by Sunday night? Keep it short and update progress.',
        ['weekend', 'build', 'accountability'],
        'Prabhakar S',
        'prabhakar@snist.edu',
        32
      )
    ];
  }

  function seedComments() {
    const now = Date.now();
    const mk = (id, postId, parentId, body, authorName, authorEmail, ageHours) => ({
      id,
      postId,
      parentId,
      body,
      authorName,
      authorEmail,
      createdAt: new Date(now - ageHours * 3600000).toISOString(),
      votes: {},
      reports: 0
    });

    return [
      mk('seed_c_1', 'seed_dev_1', null, 'Can you share your DB schema? I want to contribute backend endpoints.', 'Sanjana', 'sanjana@snist.edu', 5),
      mk('seed_c_2', 'seed_dev_1', 'seed_c_1', 'Sure, I will add an ER diagram in the repo README tonight.', 'Aditya Sharma', 'aditya@snist.edu', 4),
      mk('seed_c_3', 'seed_dsa_1', null, 'Your template is correct; add a guard for repeated shrinking.', 'Kiran', 'kiran@snist.edu', 3),
      mk('seed_c_4', 'seed_news_1', null, 'Is this open for 3rd year students with no internships?', 'Divya', 'divya@snist.edu', 1)
    ];
  }

  function loadState() {
    state.posts = readJson(POSTS_KEY, []);
    state.comments = readJson(COMMENTS_KEY, []);
    state.profiles = readJson(PROFILES_KEY, {});

    if (!Array.isArray(state.posts) || state.posts.length === 0) {
      state.posts = seedPosts();
      writeJson(POSTS_KEY, state.posts);
    }
    if (!Array.isArray(state.comments) || state.comments.length === 0) {
      state.comments = seedComments();
      writeJson(COMMENTS_KEY, state.comments);
    }
    if (!state.profiles || typeof state.profiles !== 'object') {
      state.profiles = {};
      writeJson(PROFILES_KEY, state.profiles);
    }
  }

  function savePosts() {
    writeJson(POSTS_KEY, state.posts);
  }

  function saveComments() {
    writeJson(COMMENTS_KEY, state.comments);
  }

  function saveProfiles() {
    writeJson(PROFILES_KEY, state.profiles);
  }

  function commentCountForPost(postId) {
    return state.comments.filter((comment) => comment.postId === postId).length;
  }

  function searchable(post) {
    return `${post.title} ${post.body} ${(post.tags || []).join(' ')} ${(post.techStack || []).join(' ')} ${post.authorName}`.toLowerCase();
  }

  function filteredPosts(category) {
    const view = state.view[category] || { search: '', tag: '', sort: 'newest' };
    const query = String(view.search || '').trim().toLowerCase();
    const tagQuery = String(view.tag || '').trim().replace(/^#/, '').toLowerCase();

    let list = state.posts.filter((post) => post.category === category);
    if (query) list = list.filter((post) => searchable(post).includes(query));
    if (tagQuery) {
      list = list.filter((post) => {
        const allTags = [...(post.tags || []), ...(post.techStack || [])].map((tag) => String(tag).toLowerCase());
        return allTags.some((tag) => tag.includes(tagQuery));
      });
    }

    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (view.sort === 'top') {
        return score(b.votes) - score(a.votes) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (view.sort === 'discussed') {
        return commentCountForPost(b.id) - commentCountForPost(a.id) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }

  function buildForumPageItems(totalPages, currentPage) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, idx) => idx + 1);

    const pages = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push('ellipsis-left');
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < totalPages - 1) pages.push('ellipsis-right');

    pages.push(totalPages);
    return pages;
  }

  function renderForumPagination(refs, totalPages, currentPage) {
    if (!refs?.pagination) return;
    if (totalPages <= 1) {
      refs.pagination.innerHTML = '';
      return;
    }

    const pageItems = buildForumPageItems(totalPages, currentPage);
    const numberButtons = pageItems.map((item) => {
      if (typeof item !== 'number') return '<span class="alumni-page-ellipsis" aria-hidden="true">…</span>';
      const activeClass = item === currentPage ? ' is-active' : '';
      const currentAttr = item === currentPage ? ' aria-current="page"' : '';
      return `<button type="button" class="alumni-page-btn forum-page-btn${activeClass}" data-action="goto-page" data-page="${item}"${currentAttr}>${item}</button>`;
    }).join('');

    const prevDisabled = currentPage === 1 ? ' disabled' : '';
    const nextDisabled = currentPage === totalPages ? ' disabled' : '';

    refs.pagination.innerHTML = `
      <button type="button" class="alumni-page-nav forum-page-nav" data-action="goto-page" data-page="${currentPage - 1}"${prevDisabled}>Prev</button>
      <div class="alumni-page-numbers forum-page-numbers">${numberButtons}</div>
      <button type="button" class="alumni-page-nav forum-page-nav" data-action="goto-page" data-page="${currentPage + 1}"${nextDisabled}>Next</button>
    `;
  }

  function topTags(category) {
    const tally = {};
    state.posts
      .filter((post) => post.category === category)
      .forEach((post) => {
        [...(post.tags || []), ...(post.techStack || [])].forEach((tag) => {
          const key = String(tag || '').toLowerCase();
          if (!key) return;
          tally[key] = (tally[key] || 0) + 1;
        });
      });

    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  function topContributors(category) {
    const inCategoryPostIds = new Set(state.posts.filter((post) => post.category === category).map((post) => post.id));
    const table = {};

    state.posts
      .filter((post) => post.category === category)
      .forEach((post) => {
        const key = String(post.authorEmail || '').toLowerCase();
        if (!key) return;
        if (!table[key]) table[key] = { name: post.authorName || 'SNIST User', score: 0 };
        table[key].score += score(post.votes);
      });

    state.comments
      .filter((comment) => inCategoryPostIds.has(comment.postId))
      .forEach((comment) => {
        const key = String(comment.authorEmail || '').toLowerCase();
        if (!key) return;
        if (!table[key]) table[key] = { name: comment.authorName || 'SNIST User', score: 0 };
        table[key].score += score(comment.votes);
      });

    return Object.entries(table)
      .map(([email, row]) => ({ email, ...row }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  function postCard(post, category) {
    const authorProfile = profileFor(post.authorEmail, post.authorName);
    const votes = score(post.votes);
    const commentCount = commentCountForPost(post.id);
    const categoryMeta = CATEGORY_META[category];
    const projectBadge = post.mode === 'project' ? '<span class="forum-badge project">Project</span>' : '';
    const helpBadge = post.helpNeeded ? '<span class="forum-badge help">Help Needed</span>' : '';
    const newsBadge = category === 'snistnews' ? '<span class="forum-badge news">News</span>' : '';
    const pinnedBadge = post.pinned ? '<span class="forum-badge pinned">Pinned</span>' : '';
    const tags = [...(post.tags || []), ...(post.techStack || [])].slice(0, 6);
    const excerpt = post.body.length > 180 ? `${post.body.slice(0, 177)}...` : post.body;
    const user = currentUser();
    const canDelete = user && sameUser(user.email, post.authorEmail);

    return `
      <article class="forum-post-card">
        <div class="forum-vote-col">
          <button type="button" class="forum-vote-btn" data-action="vote-post-up" data-post-id="${safe(post.id)}">▲</button>
          <span class="forum-vote-score">${votes}</span>
          <button type="button" class="forum-vote-btn" data-action="vote-post-down" data-post-id="${safe(post.id)}">▼</button>
        </div>
        <div class="forum-post-content">
          <div class="forum-post-meta">
            <span class="forum-avatar-tiny">${safe((authorProfile.username || post.authorName || 'S')[0].toUpperCase())}</span>
            <span>${safe(authorProfile.name || post.authorName || 'SNIST User')}</span>
            <span>•</span>
            <span>@${safe(authorProfile.username || 'student')}</span>
            <span>•</span>
            <span>${toAgo(post.createdAt)}</span>
          </div>
          <h3 class="forum-post-title">${safe(post.title)}</h3>
          <p class="forum-post-excerpt">${safe(excerpt)}</p>
          <div class="forum-badge-row">
            <span class="forum-badge category">${safe(categoryMeta.badge)}</span>
            ${projectBadge}
            ${newsBadge}
            ${helpBadge}
            ${pinnedBadge}
          </div>
          <div class="forum-tag-row">
            ${tags.map((tag) => `<button type="button" class="forum-tag-chip" data-action="pick-tag" data-tag="${safe(tag)}">#${safe(tag)}</button>`).join('')}
          </div>
          <div class="forum-post-actions">
            <button type="button" class="forum-link-btn" data-action="open-thread" data-post-id="${safe(post.id)}">Open Thread</button>
            <button type="button" class="forum-link-btn" data-action="copy-post-link" data-post-id="${safe(post.id)}">Copy Link</button>
            <button type="button" class="forum-link-btn" data-action="report-post" data-post-id="${safe(post.id)}">Report</button>
            ${canDelete ? `<button type="button" class="forum-link-btn danger" data-action="delete-post" data-post-id="${safe(post.id)}">Delete</button>` : ''}
            <span class="forum-post-stats">${commentCount} comments</span>
          </div>
        </div>
      </article>
    `;
  }

  function commentCard(comment, isReply) {
    const authorProfile = profileFor(comment.authorEmail, comment.authorName);
    const votes = score(comment.votes);
    const user = currentUser();
    const canDelete = user && sameUser(user.email, comment.authorEmail);

    return `
      <article class="forum-comment ${isReply ? 'is-reply' : ''}">
        <div class="forum-comment-head">
          <span class="forum-avatar-tiny">${safe((authorProfile.username || comment.authorName || 'S')[0].toUpperCase())}</span>
          <span>${safe(authorProfile.name || comment.authorName || 'SNIST User')}</span>
          <span>@${safe(authorProfile.username || 'student')}</span>
          <span>•</span>
          <span>${toAgo(comment.createdAt)}</span>
        </div>
        <p class="forum-comment-body">${safe(comment.body)}</p>
        <div class="forum-comment-actions">
          <button type="button" class="forum-link-btn" data-action="vote-comment-up" data-comment-id="${safe(comment.id)}">▲</button>
          <span class="forum-score-inline">${votes}</span>
          <button type="button" class="forum-link-btn" data-action="vote-comment-down" data-comment-id="${safe(comment.id)}">▼</button>
          <button type="button" class="forum-link-btn" data-action="reply-comment" data-comment-id="${safe(comment.id)}">Reply</button>
          <button type="button" class="forum-link-btn" data-action="report-comment" data-comment-id="${safe(comment.id)}">Report</button>
          ${canDelete ? `<button type="button" class="forum-link-btn danger" data-action="delete-comment" data-comment-id="${safe(comment.id)}">Delete</button>` : ''}
        </div>
      </article>
    `;
  }

  function threadMarkup(category, post, view) {
    const comments = state.comments
      .filter((comment) => comment.postId === post.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const byParent = new Map();
    comments.forEach((comment) => {
      const key = comment.parentId || 'root';
      const list = byParent.get(key) || [];
      list.push(comment);
      byParent.set(key, list);
    });
    const roots = byParent.get('root') || [];
    const replyTarget = comments.find((comment) => comment.id === view.replyToCommentId);
    const user = currentUser();
    const postVotes = score(post.votes);
    const canDeletePost = user && sameUser(user.email, post.authorEmail);
    const tags = [...(post.tags || []), ...(post.techStack || [])];

    return `
      <div class="forum-thread-header">
        <button type="button" class="btn btn-ghost" data-action="close-thread">Back To Feed</button>
        <div class="forum-thread-actions">
          <button type="button" class="forum-link-btn" data-action="vote-post-up" data-post-id="${safe(post.id)}">▲</button>
          <span class="forum-score-inline">${postVotes}</span>
          <button type="button" class="forum-link-btn" data-action="vote-post-down" data-post-id="${safe(post.id)}">▼</button>
          <button type="button" class="forum-link-btn" data-action="copy-post-link" data-post-id="${safe(post.id)}">Copy Link</button>
          <button type="button" class="forum-link-btn" data-action="report-post" data-post-id="${safe(post.id)}">Report</button>
          ${canDeletePost ? `<button type="button" class="forum-link-btn danger" data-action="delete-post" data-post-id="${safe(post.id)}">Delete</button>` : ''}
        </div>
      </div>
      <div class="forum-thread-post">
        <p class="forum-thread-kicker">${safe(CATEGORY_META[category].label)} • ${toAgo(post.createdAt)}</p>
        <h3>${safe(post.title)}</h3>
        <p>${safe(post.body)}</p>
        ${post.mode === 'project' ? `
          <div class="forum-project-meta">
            ${post.github ? `<a href="${safe(post.github)}" target="_blank" rel="noopener">GitHub ↗</a>` : ''}
            ${post.demo ? `<a href="${safe(post.demo)}" target="_blank" rel="noopener">Demo ↗</a>` : ''}
            ${post.screenshot ? `<a href="${safe(post.screenshot)}" target="_blank" rel="noopener">Screenshot ↗</a>` : ''}
          </div>
        ` : ''}
        <div class="forum-tag-row">
          ${tags.map((tag) => `<button type="button" class="forum-tag-chip" data-action="pick-tag" data-tag="${safe(tag)}">#${safe(tag)}</button>`).join('')}
        </div>
      </div>
      <div class="forum-thread-comments">
        <h4>Comments (${comments.length})</h4>
        ${user ? `
          <form class="forum-comment-form" data-post-id="${safe(post.id)}">
            ${replyTarget ? `<div class="forum-replying">Replying to ${safe(replyTarget.authorName)} <button type="button" data-action="cancel-reply" class="forum-link-btn">Cancel</button></div>` : ''}
            <textarea name="commentBody" placeholder="Add a comment..." required></textarea>
            <button type="submit" class="btn btn-primary">Add Comment</button>
          </form>
        ` : `
          <div class="forum-empty-block">
            <p>Log in to join the discussion.</p>
            <button type="button" class="btn btn-primary" data-action="require-login">Log In</button>
          </div>
        `}
        <div class="forum-comment-list">
          ${roots.length ? roots.map((root) => `
            <div class="forum-comment-block">
              ${commentCard(root, false)}
              ${(byParent.get(root.id) || []).map((reply) => commentCard(reply, true)).join('')}
            </div>
          `).join('') : '<div class="forum-empty-block"><p>No comments yet. Start the thread.</p></div>'}
        </div>
      </div>
    `;
  }

  function shellTemplate(category) {
    const info = CATEGORY_META[category];
    return `
      <div class="forum-toolbar">
        <div class="forum-toolbar-left">
          <p class="forum-category-desc">${safe(info.description)}</p>
          <p class="forum-category-count" data-role="count"></p>
        </div>
        <div class="forum-toolbar-right">
          <select class="filter-select forum-select" data-role="sort" aria-label="Sort posts">
            <option value="newest">Newest</option>
            <option value="top">Top</option>
            <option value="discussed">Most Discussed</option>
          </select>
          <input type="search" class="search forum-search" data-role="search" placeholder="Search title, author, tags">
          <input type="search" class="search forum-search slim" data-role="tag" placeholder="Filter by tag">
          <button type="button" class="btn btn-primary" data-role="create">Create Post</button>
        </div>
      </div>
      <div class="forum-layout">
        <div class="forum-main-col">
          <div class="forum-feed" data-role="feed"></div>
          <nav class="alumni-pagination forum-pagination" data-role="pagination" aria-label="${safe(info.label)} pagination"></nav>
          <div class="forum-thread hidden" data-role="thread"></div>
        </div>
        <aside class="forum-side-col" data-role="side">
          <div class="forum-side-card">
            <h4>Trending Tags</h4>
            <div class="forum-side-list" data-role="tags"></div>
          </div>
          <div class="forum-side-card">
            <h4>Top Contributors</h4>
            <div class="forum-side-list" data-role="contributors"></div>
          </div>
          <div class="forum-side-card">
            <h4>Your Profile</h4>
            <div class="forum-side-list" data-role="profile"></div>
          </div>
        </aside>
      </div>
    `;
  }

  function renderCategory(category) {
    const refs = refsByCategory.get(category);
    if (!refs) return;

    const view = state.view[category];
    const posts = filteredPosts(category);
    const allInCategory = state.posts.filter((post) => post.category === category).length;
    const totalFiltered = posts.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / FORUM_PAGE_SIZE));
    view.page = Math.min(Math.max(Number(view.page) || 1, 1), totalPages);
    const startIndex = (view.page - 1) * FORUM_PAGE_SIZE;
    const endIndex = Math.min(startIndex + FORUM_PAGE_SIZE, totalFiltered);
    const currentPagePosts = posts.slice(startIndex, endIndex);

    if (!totalFiltered) {
      refs.count.textContent = `Showing 0 of ${allInCategory} threads`;
      refs.feed.innerHTML = '<div class="forum-empty-block"><p>No posts yet in this category. Start the first thread.</p></div>';
      if (refs.pagination) refs.pagination.innerHTML = '';
    } else {
      const baseText = `Showing ${startIndex + 1}-${endIndex} of ${totalFiltered} threads`;
      refs.count.textContent = totalFiltered === allInCategory ? baseText : `${baseText} (filtered from ${allInCategory})`;
      refs.feed.innerHTML = currentPagePosts.map((post) => postCard(post, category)).join('');
      renderForumPagination(refs, totalPages, view.page);
    }

    const activePost = state.posts.find((post) => post.id === view.activePostId && post.category === category);
    if (!activePost) {
      refs.thread.classList.add('hidden');
      refs.thread.innerHTML = '';
    } else {
      refs.thread.classList.remove('hidden');
      refs.thread.innerHTML = threadMarkup(category, activePost, view);
    }

    const tags = topTags(category);
    refs.tags.innerHTML = tags.length
      ? tags.map(([tag, count]) => `<button type="button" class="forum-side-tag" data-action="pick-tag" data-tag="${safe(tag)}">#${safe(tag)} <span>${count}</span></button>`).join('')
      : '<p class="forum-side-empty">No tags yet</p>';

    const contributors = topContributors(category);
    refs.contributors.innerHTML = contributors.length
      ? contributors.map((item) => `<div class="forum-contrib-row"><span>${safe(item.name)}</span><span>${item.score}</span></div>`).join('')
      : '<p class="forum-side-empty">No contributor activity</p>';

    const user = currentUser();
    if (!user) {
      refs.profile.innerHTML = `
        <p class="forum-side-empty">Browse as guest or log in to create posts and comments.</p>
        <button type="button" class="btn btn-primary" data-action="require-login">Log In</button>
      `;
      return;
    }

    const profile = ensureProfile(user);
    const userEmail = String(user.email || '').toLowerCase();
    const postsCount = state.posts.filter((post) => sameUser(post.authorEmail, userEmail)).length;
    const commentsCount = state.comments.filter((comment) => sameUser(comment.authorEmail, userEmail)).length;
    const upvotes = state.posts
      .filter((post) => sameUser(post.authorEmail, userEmail))
      .reduce((sum, post) => sum + Math.max(score(post.votes), 0), 0)
      + state.comments
        .filter((comment) => sameUser(comment.authorEmail, userEmail))
        .reduce((sum, comment) => sum + Math.max(score(comment.votes), 0), 0);

    refs.profile.innerHTML = `
      <div class="forum-profile-mini">
        <div class="forum-profile-row">
          <span class="forum-avatar-tiny large">${safe((profile.username || profile.name || 'S')[0].toUpperCase())}</span>
          <div>
            <p>${safe(profile.name || user.name || 'SNIST User')}</p>
            <p class="forum-handle">@${safe(profile.username || 'student')}</p>
          </div>
        </div>
        <p class="forum-profile-line">${safe(profile.branch || 'Branch not set')} ${profile.year ? `• Year ${safe(profile.year)}` : ''}</p>
        <p class="forum-profile-line">Posts: ${postsCount} • Comments: ${commentsCount} • Upvotes: ${upvotes}</p>
        ${profile.github ? `<a href="${safe(profile.github)}" target="_blank" rel="noopener" class="forum-link-btn">GitHub ↗</a>` : ''}
        <button type="button" class="btn btn-ghost" data-action="edit-profile">Edit Profile</button>
      </div>
    `;
  }

  function renderAllCategories() {
    Object.keys(CATEGORY_META).forEach((category) => renderCategory(category));
  }

  function handleFeedAction(category, event) {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    const action = trigger.dataset.action;
    const postId = trigger.dataset.postId;

    if (action === 'open-thread') {
      state.view[category].activePostId = postId;
      state.view[category].replyToCommentId = null;
      renderCategory(category);
      const refs = refsByCategory.get(category);
      refs?.thread?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (action === 'pick-tag') {
      const tag = trigger.dataset.tag || '';
      state.view[category].tag = tag;
      state.view[category].page = 1;
      const refs = refsByCategory.get(category);
      if (refs?.tagInput) refs.tagInput.value = tag;
      renderCategory(category);
      return;
    }

    if (action === 'goto-page') {
      const targetPage = Number(trigger.dataset.page);
      if (!Number.isFinite(targetPage)) return;
      const totalPages = Math.max(1, Math.ceil(filteredPosts(category).length / FORUM_PAGE_SIZE));
      const bounded = Math.min(Math.max(targetPage, 1), totalPages);
      if (bounded === state.view[category].page) return;
      state.view[category].page = bounded;
      state.view[category].activePostId = null;
      state.view[category].replyToCommentId = null;
      renderCategory(category);
      refsByCategory.get(category)?.feed?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!postId) return;
    const post = state.posts.find((item) => item.id === postId);
    if (!post) return;

    if (action === 'vote-post-up' || action === 'vote-post-down') {
      const user = requireAuth('Log in to vote on posts.');
      if (!user) return;
      post.votes = voteEntity(post.votes, user.email, action === 'vote-post-up' ? 1 : -1);
      savePosts();
      renderCategory(category);
      return;
    }

    if (action === 'report-post') {
      post.reports = Number(post.reports || 0) + 1;
      savePosts();
      toast('Post reported. Moderator review queued.');
      renderCategory(category);
      return;
    }

    if (action === 'delete-post') {
      const user = requireAuth('Log in to manage your posts.');
      if (!user) return;
      if (!sameUser(user.email, post.authorEmail)) {
        toast('Only the author can delete this post.', 'warn');
        return;
      }
      state.posts = state.posts.filter((item) => item.id !== postId);
      state.comments = state.comments.filter((comment) => comment.postId !== postId);
      savePosts();
      saveComments();
      if (state.view[category].activePostId === postId) state.view[category].activePostId = null;
      toast('Post deleted.');
      renderCategory(category);
      return;
    }

    if (action === 'copy-post-link') {
      copyPostLink(postId);
    }
  }

  function handleThreadAction(category, event) {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    const action = trigger.dataset.action;
    const postId = trigger.dataset.postId;
    const commentId = trigger.dataset.commentId;

    if (action === 'close-thread') {
      state.view[category].activePostId = null;
      state.view[category].replyToCommentId = null;
      renderCategory(category);
      return;
    }

    if (action === 'cancel-reply') {
      state.view[category].replyToCommentId = null;
      renderCategory(category);
      return;
    }

    if (action === 'pick-tag') {
      state.view[category].tag = trigger.dataset.tag || '';
      state.view[category].page = 1;
      const refs = refsByCategory.get(category);
      if (refs?.tagInput) refs.tagInput.value = state.view[category].tag;
      state.view[category].activePostId = null;
      renderCategory(category);
      return;
    }

    if (action === 'require-login') {
      requireAuth('Please log in to interact with the forum.');
      return;
    }

    if (action === 'reply-comment' && commentId) {
      const user = requireAuth('Log in to reply.');
      if (!user) return;
      state.view[category].replyToCommentId = commentId;
      renderCategory(category);
      const refs = refsByCategory.get(category);
      refs?.thread?.querySelector('textarea[name="commentBody"]')?.focus();
      return;
    }

    if (action === 'copy-post-link' && postId) {
      copyPostLink(postId);
      return;
    }

    if (action === 'vote-post-up' || action === 'vote-post-down' || action === 'report-post' || action === 'delete-post') {
      handleFeedAction(category, event);
      return;
    }

    if (!commentId) return;
    const comment = state.comments.find((item) => item.id === commentId);
    if (!comment) return;

    if (action === 'vote-comment-up' || action === 'vote-comment-down') {
      const user = requireAuth('Log in to vote on comments.');
      if (!user) return;
      comment.votes = voteEntity(comment.votes, user.email, action === 'vote-comment-up' ? 1 : -1);
      saveComments();
      renderCategory(category);
      return;
    }

    if (action === 'report-comment') {
      comment.reports = Number(comment.reports || 0) + 1;
      saveComments();
      toast('Comment reported. Thanks for flagging.');
      renderCategory(category);
      return;
    }

    if (action === 'delete-comment') {
      const user = requireAuth('Log in to manage your comments.');
      if (!user) return;
      if (!sameUser(user.email, comment.authorEmail)) {
        toast('Only the author can delete this comment.', 'warn');
        return;
      }
      state.comments = state.comments.filter((item) => item.id !== commentId && item.parentId !== commentId);
      saveComments();
      if (state.view[category].replyToCommentId === commentId) state.view[category].replyToCommentId = null;
      toast('Comment deleted.');
      renderCategory(category);
    }
  }

  function handleThreadSubmit(category, event) {
    if (!event.target.matches('.forum-comment-form')) return;
    event.preventDefault();
    const user = requireAuth('Log in to comment.');
    if (!user) return;

    const form = event.target;
    const bodyInput = form.querySelector('textarea[name="commentBody"]');
    const body = String(bodyInput?.value || '').trim();
    if (!body) return;

    const postId = form.dataset.postId;
    if (!postId) return;

    let parentId = state.view[category].replyToCommentId || null;
    if (parentId) {
      const parent = state.comments.find((comment) => comment.id === parentId);
      if (parent?.parentId) parentId = parent.parentId;
    }

    const userProfile = ensureProfile(user);

    state.comments.push({
      id: uid('comment'),
      postId,
      parentId,
      body,
      authorName: userProfile?.name || user.name || deriveNameFromEmail(user.email),
      authorEmail: user.email,
      createdAt: nowIso(),
      votes: {},
      reports: 0
    });

    saveComments();
    state.view[category].replyToCommentId = null;
    bodyInput.value = '';
    toast('Comment added.');
    renderCategory(category);
  }

  async function copyPostLink(postId) {
    const link = `${window.location.origin}${window.location.pathname}#post=${postId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast('Thread link copied.');
    } catch {
      toast('Could not copy link.', 'warn');
    }
  }

  function bindCategoryShell(shell, category) {
    shell.innerHTML = shellTemplate(category);

    const refs = {
      shell,
      count: shell.querySelector('[data-role="count"]'),
      sort: shell.querySelector('[data-role="sort"]'),
      search: shell.querySelector('[data-role="search"]'),
      tagInput: shell.querySelector('[data-role="tag"]'),
      createButton: shell.querySelector('[data-role="create"]'),
      feed: shell.querySelector('[data-role="feed"]'),
      pagination: shell.querySelector('[data-role="pagination"]'),
      thread: shell.querySelector('[data-role="thread"]'),
      tags: shell.querySelector('[data-role="tags"]'),
      contributors: shell.querySelector('[data-role="contributors"]'),
      profile: shell.querySelector('[data-role="profile"]'),
      side: shell.querySelector('[data-role="side"]')
    };
    refsByCategory.set(category, refs);

    state.view[category] = {
      search: '',
      tag: '',
      sort: 'newest',
      page: 1,
      activePostId: null,
      replyToCommentId: null
    };

    refs.sort.addEventListener('change', () => {
      state.view[category].sort = refs.sort.value || 'newest';
      state.view[category].page = 1;
      renderCategory(category);
    });

    refs.search.addEventListener('input', () => {
      state.view[category].search = refs.search.value || '';
      state.view[category].page = 1;
      renderCategory(category);
    });

    refs.tagInput.addEventListener('input', () => {
      state.view[category].tag = refs.tagInput.value || '';
      state.view[category].page = 1;
      renderCategory(category);
    });

    refs.createButton.addEventListener('click', () => openPostModal(category));
    refs.feed.addEventListener('click', (event) => handleFeedAction(category, event));
    refs.pagination?.addEventListener('click', (event) => handleFeedAction(category, event));
    refs.thread.addEventListener('click', (event) => handleThreadAction(category, event));
    refs.thread.addEventListener('submit', (event) => handleThreadSubmit(category, event));
    refs.side.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-action]');
      if (!trigger) return;
      if (trigger.dataset.action === 'pick-tag') {
        state.view[category].tag = trigger.dataset.tag || '';
        state.view[category].page = 1;
        refs.tagInput.value = state.view[category].tag;
        renderCategory(category);
      } else if (trigger.dataset.action === 'require-login') {
        requireAuth('Please log in first.');
      } else if (trigger.dataset.action === 'edit-profile') {
        openProfileModal();
      }
    });
  }

  function openForumModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeForumModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
  }

  function syncPostModeFields() {
    const mode = ui.postForm?.querySelector('[name="mode"]')?.value || 'discussion';
    if (!ui.projectFields) return;
    const github = ui.postForm?.querySelector('[name="github"]');
    ui.projectFields.classList.toggle('hidden', mode !== 'project');
    if (github) github.required = mode === 'project';
  }

  function openPostModal(category) {
    const user = requireAuth('Log in to create a post.');
    if (!user) return;
    ensureProfile(user);

    if (!ui.postForm || !ui.postModal) return;
    ui.postForm.reset();
    ui.postForm.querySelector('[name="category"]').value = category;
    ui.postForm.querySelector('[name="mode"]').value = CATEGORY_META[category]?.defaultMode || 'discussion';
    syncPostModeFields();
    openForumModal(ui.postModal);
  }

  function openProfileModal() {
    const user = requireAuth('Log in to edit profile.');
    if (!user) return;
    const profile = ensureProfile(user);
    if (!profile || !ui.profileForm || !ui.profileModal) return;

    ui.profileForm.querySelector('[name="name"]').value = profile.name || user.name || '';
    ui.profileForm.querySelector('[name="username"]').value = profile.username || '';
    ui.profileForm.querySelector('[name="branch"]').value = profile.branch || '';
    ui.profileForm.querySelector('[name="year"]').value = profile.year || '';
    ui.profileForm.querySelector('[name="skills"]').value = (profile.skills || []).join(', ');
    ui.profileForm.querySelector('[name="github"]').value = profile.github || '';
    ui.profileForm.querySelector('[name="bio"]').value = profile.bio || '';
    openForumModal(ui.profileModal);
  }

  function handleCreatePostSubmit(event) {
    event.preventDefault();
    const user = requireAuth('Log in to create a post.');
    if (!user || !ui.postForm) return;
    const profile = ensureProfile(user);

    const data = new FormData(ui.postForm);
    const category = String(data.get('category') || '').trim();
    const mode = String(data.get('mode') || 'discussion').trim();
    const title = String(data.get('title') || '').trim();
    const body = String(data.get('body') || '').trim();
    const tags = parseCsvTags(data.get('tags'));
    const techStack = parseCsvTags(data.get('techStack'));
    const github = String(data.get('github') || '').trim();
    const demo = String(data.get('demo') || '').trim();
    const screenshot = String(data.get('screenshot') || '').trim();
    const helpNeeded = Boolean(data.get('helpNeeded'));

    if (!CATEGORY_META[category]) {
      toast('Select a valid category.', 'warn');
      return;
    }
    if (!title || !body) {
      toast('Title and content are required.', 'warn');
      return;
    }
    if (mode === 'project' && !github) {
      toast('GitHub link is required for project posts.', 'warn');
      return;
    }

    const post = {
      id: uid('post'),
      category,
      mode,
      title,
      body,
      tags,
      techStack,
      github,
      demo,
      screenshot,
      helpNeeded,
      authorName: profile?.name || user.name || deriveNameFromEmail(user.email),
      authorEmail: user.email,
      createdAt: nowIso(),
      votes: {},
      reports: 0,
      pinned: false
    };

    state.posts.unshift(post);
    savePosts();
    closeForumModal(ui.postModal);

    state.view[category].page = 1;
    state.view[category].activePostId = post.id;
    state.view[category].replyToCommentId = null;
    toast('Post created.');
    renderCategory(category);
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    const user = requireAuth('Log in to update profile.');
    if (!user || !ui.profileForm) return;

    const key = userKeyFrom(user);
    const data = new FormData(ui.profileForm);
    const name = String(data.get('name') || '').trim();
    const username = String(data.get('username') || '').trim().replace(/\s+/g, '');
    const branch = String(data.get('branch') || '').trim();
    const year = String(data.get('year') || '').trim();
    const skills = parseCsvTags(data.get('skills'));
    const github = String(data.get('github') || '').trim();
    const bio = String(data.get('bio') || '').trim();

    if (!name || !username) {
      toast('Name and username are required.', 'warn');
      return;
    }

    const usernameTaken = Object.entries(state.profiles).some(([email, profile]) => {
      if (email === key) return false;
      return String(profile.username || '').toLowerCase() === username.toLowerCase();
    });
    if (usernameTaken) {
      toast('Username already taken. Try another one.', 'warn');
      return;
    }

    state.profiles[key] = { name, username, branch, year, skills, github, bio };
    saveProfiles();
    closeForumModal(ui.profileModal);
    toast('Profile updated.');
    renderAllCategories();
  }

  function ensureModals() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div id="forumPostModal" class="modal hidden forum-modal">
        <div class="modal-content forum-modal-content">
          <div class="modal-header">
            <h2>Create Forum Post</h2>
            <button type="button" class="forum-modal-close" data-close-forum-modal="forumPostModal" aria-label="Close">&times;</button>
          </div>
          <form id="forumPostForm" class="forum-modal-form">
            <div class="forum-form-grid">
              <div class="form-group">
                <label for="forumPostCategory">Category</label>
                <select id="forumPostCategory" class="filter-select forum-select" name="category" required>
                  <option value="devworms">Dev Worms</option>
                  <option value="dsaworms">DSA Worms</option>
                  <option value="snistnews">SNIST News</option>
                  <option value="partychat">PartyChat</option>
                </select>
              </div>
              <div class="form-group">
                <label for="forumPostMode">Post Type</label>
                <select id="forumPostMode" class="filter-select forum-select" name="mode" required>
                  <option value="project">Project Post</option>
                  <option value="discussion">Discussion Post</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="forumPostTitle">Title</label>
              <input id="forumPostTitle" name="title" required maxlength="140" placeholder="Clear thread title">
            </div>
            <div class="form-group">
              <label for="forumPostBody">Content</label>
              <textarea id="forumPostBody" name="body" required maxlength="3000" placeholder="Describe your problem, project update, or question"></textarea>
            </div>
            <div class="form-group">
              <label for="forumPostTags">Tags (comma separated)</label>
              <input id="forumPostTags" name="tags" placeholder="react, interview, campus">
            </div>
            <div id="forumProjectFields" class="forum-project-fields hidden">
              <div class="form-group">
                <label for="forumPostGithub">GitHub Link</label>
                <input id="forumPostGithub" name="github" placeholder="https://github.com/username/repo">
              </div>
              <div class="forum-form-grid">
                <div class="form-group">
                  <label for="forumPostDemo">Demo Link</label>
                  <input id="forumPostDemo" name="demo" placeholder="https://demo.example.com">
                </div>
                <div class="form-group">
                  <label for="forumPostScreenshot">Screenshot URL</label>
                  <input id="forumPostScreenshot" name="screenshot" placeholder="https://image.example.com">
                </div>
              </div>
              <div class="form-group">
                <label for="forumPostStack">Tech Stack Tags</label>
                <input id="forumPostStack" name="techStack" placeholder="react, node, mongo">
              </div>
              <label class="forum-checkbox">
                <input type="checkbox" name="helpNeeded">
                <span>Mark as Help Needed</span>
              </label>
            </div>
            <button type="submit" class="modal-btn">Publish Post</button>
          </form>
        </div>
      </div>

      <div id="forumProfileModal" class="modal hidden forum-modal">
        <div class="modal-content forum-modal-content">
          <div class="modal-header">
            <h2>Edit Profile</h2>
            <button type="button" class="forum-modal-close" data-close-forum-modal="forumProfileModal" aria-label="Close">&times;</button>
          </div>
          <form id="forumProfileForm" class="forum-modal-form">
            <div class="forum-form-grid">
              <div class="form-group">
                <label for="forumProfileName">Name</label>
                <input id="forumProfileName" name="name" required>
              </div>
              <div class="form-group">
                <label for="forumProfileUsername">Username</label>
                <input id="forumProfileUsername" name="username" required>
              </div>
            </div>
            <div class="forum-form-grid">
              <div class="form-group">
                <label for="forumProfileBranch">Branch</label>
                <input id="forumProfileBranch" name="branch" placeholder="CSE / ECE / IT">
              </div>
              <div class="form-group">
                <label for="forumProfileYear">Year</label>
                <select id="forumProfileYear" class="filter-select forum-select" name="year">
                  <option value="">Select year</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="forumProfileSkills">Skills (comma separated)</label>
              <input id="forumProfileSkills" name="skills" placeholder="react, java, sql">
            </div>
            <div class="form-group">
              <label for="forumProfileGithub">GitHub Link</label>
              <input id="forumProfileGithub" name="github" placeholder="https://github.com/username">
            </div>
            <div class="form-group">
              <label for="forumProfileBio">Bio</label>
              <textarea id="forumProfileBio" name="bio" maxlength="300" placeholder="Short intro about what you build"></textarea>
            </div>
            <button type="submit" class="modal-btn">Save Profile</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    ui.postModal = document.getElementById('forumPostModal');
    ui.postForm = document.getElementById('forumPostForm');
    ui.profileModal = document.getElementById('forumProfileModal');
    ui.profileForm = document.getElementById('forumProfileForm');
    ui.projectFields = document.getElementById('forumProjectFields');

    ui.postForm?.querySelector('[name="mode"]')?.addEventListener('change', syncPostModeFields);
    ui.postForm?.addEventListener('submit', handleCreatePostSubmit);
    ui.profileForm?.addEventListener('submit', handleProfileSubmit);

    document.querySelectorAll('[data-close-forum-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        const modalId = button.getAttribute('data-close-forum-modal');
        closeForumModal(document.getElementById(modalId));
      });
    });

    [ui.postModal, ui.profileModal].forEach((modal) => {
      modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeForumModal(modal);
      });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeForumModal(ui.postModal);
      closeForumModal(ui.profileModal);
    });
  }

  function ensureToastHost() {
    const host = document.createElement('div');
    host.id = 'forumToastHost';
    host.className = 'forum-toast-host';
    document.body.appendChild(host);
    ui.toastHost = host;
  }

  function toast(message, kind = 'ok') {
    if (!ui.toastHost) return;
    const node = document.createElement('div');
    node.className = `forum-toast ${kind}`;
    node.textContent = message;
    ui.toastHost.appendChild(node);
    window.setTimeout(() => node.classList.add('show'), 10);
    window.setTimeout(() => {
      node.classList.remove('show');
      window.setTimeout(() => node.remove(), 180);
    }, 2400);
  }

  function bindGlobalSearchBridge() {
    const globalSearch = document.getElementById('globalSearch');
    if (!globalSearch) return;
    globalSearch.addEventListener('input', () => {
      const activeNav = document.querySelector('.nav-item.active')?.getAttribute('data-section');
      const category = activeNav === 'news' ? 'snistnews' : activeNav === 'chat' ? 'partychat' : activeNav;
      if (!category || !state.view[category]) return;
      state.view[category].search = globalSearch.value || '';
      state.view[category].page = 1;
      const refs = refsByCategory.get(category);
      if (refs?.search) refs.search.value = globalSearch.value || '';
      renderCategory(category);
    });
  }

  function init() {
    const shells = document.querySelectorAll('.forum-shell[data-category]');
    if (!shells.length) return;

    loadState();
    ensureModals();
    ensureToastHost();

    shells.forEach((shell) => {
      const category = shell.getAttribute('data-category');
      if (!CATEGORY_META[category]) return;
      bindCategoryShell(shell, category);
    });

    bindGlobalSearchBridge();
    renderAllCategories();

    window.addEventListener('snist-auth-changed', () => {
      renderAllCategories();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
