// Skill source links and install commands, shared by search cards and the detail modal.

// Split an install path ("owner/repo/path[/SKILL.md]") without encoding repository paths
function parseSkillSource(install, branch = 'main') {
    if (!install || install.startsWith('local/')) return null;
    const parts = install.split('/');
    if (parts.length < 2) return null;

    let path = parts.slice(2).join('/').replace(/\/+$/, '');
    if (/\/SKILL\.md$/i.test(path)) {
        path = path.replace(/\/SKILL\.md$/i, '');
    } else if (/^SKILL\.md$/i.test(path)) {
        path = '';
    }
    return {
        base: `https://github.com/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`,
        repo: parts.slice(0, 2).join('/'),
        branch,
        path
    };
}

// Generate proper GitHub URL from install path and branch
function getGitHubUrl(install, branch = 'main') {
    if (install && install.startsWith('local/')) {
        const path = install.slice(6).replace(/\/SKILL\.md$/i, '');
        return `https://github.com/majiayu000/claude-skill-registry/blob/main/skills/${path.split('/').map(encodeURIComponent).join('/')}/SKILL.md`;
    }
    const source = parseSkillSource(install, branch);
    if (!source) return '#';
    const path = source.path.split('/').map(encodeURIComponent).join('/');
    return `${source.base}/blob/${encodeURIComponent(source.branch)}/${path ? path + '/' : ''}SKILL.md`;
}

function shellQuote(value) {
    if (/^[A-Za-z0-9._~:\/%-]+$/.test(value)) return value;
    return "'" + value.split("'").join("'\\''") + "'";
}

// skills CLI command (github.com/vercel-labs/skills); it prompts for target agents
function getInstallCommand(install, branch = 'main') {
    const source = parseSkillSource(install, branch);
    // The CLI treats # as a ref delimiter and : as a URL, even inside subpaths.
    if (!source || /[#:]/.test(source.path)) return '';
    const target = `${source.repo}${source.path ? '/' + source.path : ''}#${encodeURIComponent(source.branch)}`;
    return `npx skills add ${shellQuote(target)}`;
}
