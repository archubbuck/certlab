# CertLab Scripts

This directory contains utility scripts for managing and maintaining the CertLab project.

## Issue Prioritization

### `issue-prioritizer.ts`

**Purpose**: Analyzes all open GitHub issues and prioritizes them according to ROADMAP.md phases and dependencies.

**Usage**:
```bash
npx tsx scripts/issue-prioritizer.ts
```

**Output**: 
- Generates `ROADMAP_TRACKING.md` in the project root
- Provides a prioritized list of all open issues
- Maps each issue to its corresponding roadmap phase
- Documents dependencies and reasoning for each issue's priority

**Features**:
- Automatic phase detection based on issue title and content
- Dependency tracking between issues
- Support for critical path, security, and accessibility badges
- Detailed reasoning for each priority assignment
- Timeline tracking from issue labels

**Phase Definitions**:
- **Phase 0**: Study Materials Marketplace & Access Control (Critical Path)
- **Phase 1**: Foundation & Core Infrastructure (Critical Path)
- **Phase 1.5**: Firebase Completion & Enhancement (Critical Path, Q1 2025)
- **Phase 2**: Content Authoring & Management
- **Phase 3**: User Experience & Accessibility
- **Phase 4**: Permissions & Access Control
- **Phase 5**: Discovery & Navigation
- **Phase 6**: Distribution & Engagement
- **Phase 7**: Analytics & Insights
- **Phase 8**: Customization & Localization
- **Phase 9**: Quality of Life Improvements
- **Phase 10**: Release Preparation

**Example Output**: See [ROADMAP_TRACKING.md](../ROADMAP_TRACKING.md)

## Roadmap Management

### `roadmap-tracker.ts`

**Purpose**: Parses ROADMAP.md to extract features, validate implementation status, and generate GitHub issues.

**Usage**:
```bash
# Dry run (preview mode)
npx tsx scripts/roadmap-tracker.ts

# Live mode (create issues)
npx tsx scripts/roadmap-tracker.ts --live
```

**Features**:
- Parses all features from ROADMAP.md
- Validates implementation status in the codebase
- Generates GitHub issue templates
- Creates issues with proper labels and metadata
- Generates tracking checklist

**Integration**: The `issue-prioritizer.ts` script complements this by prioritizing existing open issues, while `roadmap-tracker.ts` focuses on creating new issues from the roadmap.

## Gamification

### `seed-gamification-data.ts`

**Purpose**: Seeds gamification data (badges, achievements, etc.) into the database.

**Usage**:
```bash
npx tsx scripts/seed-gamification-data.ts
```

## Dynatrace Integration

### `check-dynatrace-config.js`

Validates Dynatrace configuration.

### `generate-dynatrace-snippet.js`

Generates Dynatrace monitoring snippets.

### `test-dynatrace-integration.cjs`

Tests Dynatrace integration functionality.

## Firebase Configuration

### `check-firebase-config.js`

Validates Firebase configuration and credentials.

## Shell Scripts

### `create-roadmap-issues.sh`

Legacy shell script for creating roadmap issues. Consider using `roadmap-tracker.ts` instead.

---

## Development Guidelines

### Adding New Scripts

1. Place scripts in the `/scripts` directory
2. Use TypeScript for new scripts (`.ts` extension)
3. Add shebang line: `#!/usr/bin/env tsx`
4. Make the script executable: `chmod +x scripts/your-script.ts`
5. Document usage in this README
6. Add error handling and helpful output messages

### Script Conventions

- Use `console.log()` for informational messages
- Use `console.error()` for errors
- Exit with code 1 on failure: `process.exit(1)`
- Exit with code 0 on success (default)
- Use emoji for visual clarity (🚀 ✅ ❌ ⚠️ 📝 etc.)

### Testing Scripts

Before committing, test scripts in both success and failure scenarios:
```bash
# Test the script
npx tsx scripts/your-script.ts

# Verify output files
ls -lh GENERATED_FILE.md
cat GENERATED_FILE.md
```

---

## Related Documentation

- [ROADMAP.md](../ROADMAP.md) - Project roadmap and feature planning
- [ROADMAP_TRACKING.md](../ROADMAP_TRACKING.md) - Prioritized issue tracking (generated)
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [docs/](../docs/) - Additional documentation
