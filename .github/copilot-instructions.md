# Python Matter Server

Python Matter Server is an officially certified Software Component that provides Matter controller support. It serves as the foundation for Matter support in Home Assistant and other projects. The server implements a Matter Controller over WebSockets using the official Matter SDK.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Setup
- **CRITICAL**: Matter Server requires Linux or macOS with specific IPv6 networking configuration. Windows/WSL is NOT supported.
- Set up the complete development environment:
  ```bash
  scripts/setup.sh
  ```
  - Creates Python virtual environment in `.venv/`
  - Installs Python dependencies including Matter SDK components
  - Installs pre-commit hooks for code quality
  - **TIMING**: Typically takes 3-5 minutes. NEVER CANCEL - wait up to 10 minutes for completion.
  - **NETWORK ISSUE**: If pip install fails with timeout errors (common with Matter SDK dependencies), this is due to network limitations, not code issues.

### Python Server Development
- **Always run the bootstrapping steps first before any Python development**
- Start the Matter server:
  ```bash
  # Basic server (info log level)
  python -m matter_server.server

  # Debug mode
  python -m matter_server.server --log-level debug

  # SDK debug mode
  python -m matter_server.server --log-level-sdk progress
  ```
- Create `/data` directory with proper permissions if it doesn't exist
- Server runs on port 5580 by default (WebSocket endpoint)
- Alternative entry point: `python main.py`

### Dashboard Development
- **Dashboard setup** (requires Python dependencies to be available):
  ```bash
  cd dashboard
  script/setup
  ```
  - Runs `npm install` (~15 seconds)
  - Generates descriptions file from Python source
  - **TIMING**: ~30 seconds total. NEVER CANCEL - set timeout to 2+ minutes.

- **Development server**:
  ```bash
  cd dashboard
  script/develop
  ```
  - Starts TypeScript compiler in watch mode
  - Starts development server on http://localhost:5010
  - Live reload for development changes
  - **TIMING**: Starts in ~5 seconds

- **Production build**:
  ```bash
  cd dashboard
  script/build
  ```
  - Builds optimized TypeScript/JavaScript bundle
  - Copies build to `matter_server/dashboard/` directory
  - **TIMING**: ~10 seconds. NEVER CANCEL - set timeout to 2+ minutes.

### Testing and Code Quality
- **Run complete test suite**:
  ```bash
  scripts/run-in-env.sh pytest --durations 10 --cov-report term-missing --cov=matter_server --cov-report=xml tests/
  ```
  - **TIMING**: Typically 2-3 minutes. NEVER CANCEL - set timeout to 10+ minutes.

- **Pre-commit validation** (REQUIRED before commits):
  ```bash
  SKIP=no-commit-to-branch pre-commit run --all-files
  ```
  - Runs ruff (linting + formatting), pylint, mypy, codespell, and other checks
  - **TIMING**: 1-2 minutes for all files. NEVER CANCEL - set timeout to 5+ minutes.

- **Individual linting tools**:
  ```bash
  scripts/run-in-env.sh ruff check --fix
  scripts/run-in-env.sh ruff format
  scripts/run-in-env.sh pylint matter_server/ tests/
  scripts/run-in-env.sh mypy
  ```

## Validation Scenarios

**ALWAYS manually validate changes using complete end-to-end scenarios:**

### Python Server Validation
1. Start the server: `python -m matter_server.server --log-level debug`
2. Verify WebSocket endpoint responds (server starts without errors)
3. Check dashboard is accessible if built: verify `matter_server/dashboard/` contains files
4. Test example client: `python scripts/example.py` (requires dependencies)

### Dashboard Validation
1. Build dashboard: `cd dashboard && script/build`
2. Verify build artifacts: check `matter_server/dashboard/js/` contains compiled JavaScript
3. Start development server: `cd dashboard && script/develop`
4. Access http://localhost:5010 and verify dashboard loads
5. Test WebSocket connection input (should prompt for server URL)

### Pre-commit Validation
**CRITICAL**: Always run before pushing changes or CI will fail:
```bash
SKIP=no-commit-to-branch pre-commit run --all-files
```

## Repository Structure

### Key Directories
```
matter_server/           # Main Python package
├── client/             # Matter client library
├── server/             # Matter server implementation
├── common/             # Shared utilities
└── dashboard/          # Built web dashboard (auto-generated)

dashboard/              # Dashboard source code (TypeScript/Lit)
├── src/               # TypeScript source files
├── script/            # Build and development scripts
└── public/            # Static assets

scripts/               # Development utilities
├── setup.sh          # Main environment setup
├── example.py        # Server/client example
└── generate_descriptions.py  # Generates dashboard type definitions

tests/                 # Test suite (pytest-based)
docs/                  # Documentation
├── os_requirements.md # Operating system setup requirements
├── docker.md         # Docker deployment guide
└── websockets_api.md  # WebSocket API documentation
```

### Important Files
- `pyproject.toml` - Python packaging and tool configuration
- `main.py` - Alternative server entry point
- `.pre-commit-config.yaml` - Code quality hooks configuration
- `DEVELOPMENT.md` - Detailed development setup guide

## Common Issues and Solutions

### Network Timeouts During Setup
**SYMPTOM**: `pip install` fails with `ReadTimeoutError` from PyPI
**CAUSE**: Matter SDK dependencies are large and can timeout on slow connections
**SOLUTION**:
- Retry setup: `scripts/setup.sh`
- Use `pip install --timeout 300` for extended timeout
- **Document as known issue** if persistent

### IPv6/Networking Issues
**SYMPTOM**: Matter devices not discoverable or connection failures
**REFERENCE**: See `docs/os_requirements.md` for complete networking requirements
**KEY REQUIREMENTS**:
- IPv6 support enabled on host interface
- No multicast filtering on network equipment
- Proper ICMPv6 Router Advertisement processing
- For Thread devices: specific kernel options and sysctl settings

### Pre-commit Hook Failures
**SYMPTOM**: Git commits rejected due to formatting/linting issues
**SOLUTION**:
```bash
SKIP=no-commit-to-branch pre-commit run --all-files
scripts/run-in-env.sh ruff format  # Fix formatting
scripts/run-in-env.sh ruff check --fix  # Fix linting issues
```

### Dashboard Build Issues
**SYMPTOM**: `script/setup` fails with "No module named 'chip'"
**CAUSE**: Python Matter SDK dependencies not installed
**SOLUTION**: Run `scripts/setup.sh` first to install Python dependencies

## Development Tips

- **Always** activate virtual environment: `source .venv/bin/activate`
- Use `scripts/run-in-env.sh` for consistent tool execution across environments
- Dashboard development can proceed independently once built once
- Server requires `/data` directory for persistent storage
- Matter protocol requires specific OS and network configuration (see `docs/os_requirements.md`)
- Example usage patterns available in `scripts/example.py`
- WebSocket API documentation in `docs/websockets_api.md`

## CI/CD Integration

The project uses GitHub Actions (`.github/workflows/test.yml`):
- Linting: pre-commit hooks on Python 3.12
- Testing: pytest on Python 3.12 and 3.13
- **Always ensure pre-commit passes locally** before pushing to avoid CI failures

## Project Context

This project implements both server and client components:
- **Server**: Runs Matter Controller with WebSocket API
- **Client**: Python library for consuming the WebSocket API (used by Home Assistant)
- **Dashboard**: Web-based debugging and testing interface
- **Architecture**: Allows multiple consumers to connect to same Matter fabric
- **Deployment**: Available as Home Assistant add-on, Docker container, or standalone

The separation enables scenarios where the Matter fabric continues running while consumers (like Home Assistant) restart or disconnect.

## Linting and Code Quality Requirements

**CRITICAL**: All code changes MUST pass linting checks before submitting PRs. The CI will fail if linting issues are present.

### Required Linting Steps Before PR Submission

Always run these commands before committing and pushing changes:

```bash
# Run all pre-commit checks (REQUIRED)
SKIP=no-commit-to-branch pre-commit run --all-files

# Individual linting tools for troubleshooting
scripts/run-in-env.sh ruff check --fix      # Fix linting issues
scripts/run-in-env.sh ruff format           # Fix formatting
scripts/run-in-env.sh pylint matter_server/ tests/  # Check code quality
scripts/run-in-env.sh mypy                  # Check type annotations
```

### Linting Tools Used

The project uses multiple linting tools enforced via pre-commit hooks:

- **ruff**: Fast Python linter and formatter (replaces flake8, isort, etc.)
- **pylint**: Static code analysis for code quality
- **mypy**: Static type checking
- **codespell**: Spell checking for code and documentation
- **File format checks**: JSON, TOML validation, trailing whitespace, end-of-file fixers

### Common Linting Failures

**Trailing Whitespace**: Remove all trailing spaces from lines
**Missing Newline**: Ensure files end with a single newline character
**Import Order**: Use `ruff format` to fix import sorting
**Type Annotations**: Add type hints where mypy reports missing annotations
**Spelling**: Use `codespell` to check for typos in code and comments

### Automated Fixing

Most linting issues can be automatically fixed:

```bash
scripts/run-in-env.sh ruff check --fix    # Auto-fix many linting issues
scripts/run-in-env.sh ruff format         # Auto-format code
```

**Always verify changes after auto-fixing and run the full pre-commit suite before submitting.**
