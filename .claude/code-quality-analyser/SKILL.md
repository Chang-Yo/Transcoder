# Video Transcoder Code Quality Analysis Skill

## Project Background
- **Application Type**: Desktop video transcoder (converts to ProRes/DNxHR formats)
- **Target Users**: Adobe Premiere Pro and After Effects users
- **Technology Stack**:
  - Frontend: TypeScript + React + Vite
  - Backend: Rust + Tauri
  - Media Processing: FFmpeg

## Skill Trigger Commands
When the user says “analyze code quality,” “code review,” or “check code,” execute the following analysis workflow.

## Analysis Execution Workflow

### Step 1: Project Structure Analysis
Use `list_files` to recursively scan the project directory, generating a complete file tree structure. Focus on:
- Frontend component organization (src/components, src/pages, etc.)
- Rust backend module division (src-tauri/src)
- Location and naming of configuration files
- Organization of test files

**Output**: Whether the project structure is clear and if there are issues with disorganized file structure

---

### Step 2: In-Depth Analysis of Critical Files

#### 2.1 Frontend Code Analysis
Sequentially read and analyze the following file types:

**React Components** (prioritize core components)
```bash
# Locate primary components
find src/components -name “*.tsx” -o -name “*.ts”
```

**Analysis Focus**:
- **Single Responsibility Principle**: Identify “God components” (exceeding 300 lines or handling unrelated logic)
- **State Management**:
  - Avoid misuse of useState (where useReducer is appropriate)
  - Evaluate the rationality of state lifting
  - Need for state management libraries (Zustand/Jotai)
- **Props Design**:
  - Are type definitions complete?
  - Does prop drilling occur (over 3 levels deep)?
- **Side Effect Management**:
  - Are useEffect dependency arrays correct?
  - Are there memory leak risks (uncleaned subscriptions, timers)?
- **Performance Optimization**:
  - Need for useMemo/useCallback
  - Correct key usage for list rendering
- **Error Boundaries**: Error handling mechanisms in place

**Tauri IPC Call Logic**
```typescript
// Search for invoke calls
grep -r “invoke(” src/
```

**Analysis Focus**:
- Consistent error handling across API calls
- Type-safe IPC interface definitions
- Duplicate call logic (should be encapsulated as hooks)

---

#### 2.2 Rust Backend Analysis
Sequentially read and analyze:

**Tauri Command Handler Functions**
```bash
# Search for #[tauri::command]
grep -r “#\[tauri::command\]” src-tauri/src/
```

**Analysis Points**:
- **Error Handling**:
  - Does it use the Result type?
  - Are error messages user-friendly?
  - Is there a unified error type definition?
- **Concurrency Safety**:
  - Does shared state use Arc<Mutex<T>> or Arc<RwLock<T>>?
  - Are there deadlock risks?
- **Resource Management**:
  - Are file handles and processes properly closed?
  - Does FFmpeg process have a timeout mechanism?
- **Performance Considerations**:
  - Are CPU-intensive operations using tokio::spawn_blocking
  - Are there unnecessary clone() calls

**FFmpeg Integration Logic**
```bash
# Locate FFmpeg-related code
grep -r “ffmpeg\|Command::new” src-tauri/src/
```

**Analysis Focus**:
- **Process Management**:
  - Is FFmpeg process lifecycle handled correctly?
  - Does reading standard output/error cause blocking?
  - Does canceling transcoding properly terminate processes?
- **Parameter Construction**:
  - Are FFmpeg parameters parameterized and configurable?
  - Is parameter validation logic implemented?
- **Progress Reporting**:
  - Does it parse FFmpeg's progress output?
  - Is the progress update frequency reasonable?

**Module Structure**
```bash
# View mod structure
cat src-tauri/src/lib.rs
cat src-tauri/src/main.rs
```

**Analysis Points**:
- Are module responsibilities clear (e.g., ffmpeg module, config module, state module)?
- Are there any circular dependencies?
- Is the exposure of public interfaces (pub) reasonable?

---

### Step 3: Cross-language Interaction Analysis

**Type Definition Consistency**
- Verify alignment between Rust structs and TypeScript interfaces
- Confirm use of type generation tools (e.g., ts-rs)

**Sample Checkpoints**:
```rust
// Rust side
#[derive(Serialize)]
struct TranscodeProgress {
    percentage: f64,
    current_frame: u64,
}
```

```typescript
// TS side should have corresponding type
interface TranscodeProgress {
    percentage: number;
    current_frame: number;
}
```

---

### Step 4: Code Quality Issues Summary

Output a structured report categorized by priority:

#### 🔴 High-Priority Issues (Logical Errors & Potential Bugs)
- Missing or improper error handling
- Resource leak risks
- Concurrency safety issues
- Type mismatches

#### 🟡 Medium Priority Issues (Code Organization & Maintainability)
- Unclear component/module responsibilities
- Duplicate code
- Non-standard naming
- Missing comments

#### 🟢 Low Priority Issues (Optimization Suggestions)
- Performance optimization opportunities
- Improved design patterns
- Dependency simplification

---

### Step 5: Refactoring Recommendations

Provide specific refactoring solutions for identified issues:

**Sample Output Format**:
```
Issue: VideoPlayer component exceeds 500 lines, encompassing multiple responsibilities including video playback, transcoding controls, and file management

Recommended Refactoring:
1. Split into three components:
   - VideoPlayer (pure player)
   - TranscodeControls (transcoding control panel)
   - FileManager (file list management)

2. Extract custom Hooks:
   - useVideoPlayer (player state)
   - useTranscodeQueue (transcoding queue management)

3. Code Example:
   [Provide specific refactoring code snippets]
```

---

## Command Execution Examples

```bash
# Analyze entire project
cd /path/to/your/project
ls -R src src-tauri/src

# Analyze specific component
cat src/components/VideoPlayer.tsx

# Analyze Rust backend
cat src-tauri/src/transcode.rs

# Identify potential issues
grep -r “unwrap()” src-tauri/src/  # Unsafe unwrap in Rust
grep -r “any” src/  # any type in TypeScript
```

---

## Usage Frequency Recommendations
- **Daily Use**: Run once before committing code
- **Weekly Deep Analysis**: Conduct comprehensive code quality checks on Fridays
- **Mandatory Pre-Refactor**: Analyze current state before large-scale refactoring

---

## Output Example

```
📊 Code Quality Analysis Report - 2024-01-19

Project Statistics:
- Frontend Files: 43 TS/TSX files
- Backend Files: 12 Rust files
- Total Lines of Code: Approximately 8,500 lines

🔴 High-Priority Issues (3)

1. [Logical Error] src-tauri/src/ffmpeg.rs:45
   Issue: FFmpeg process lacks timeout configuration, potentially causing application hang
   Impact: Severe degradation of user experience
   Suggested fix:
   ```rust
   let output = tokio::time::timeout(
       Duration::from_secs(config.timeout),
       child.wait_with_output()
   ).await??;
   ```

2. [Resource Leak] src/hooks/useTranscode.ts:78
   Issue: Tauri event listener not cleaned up when component unmounted
   Impact: Memory leak
   Fix suggestion:
   ```typescript
   useEffect(() => {
       const unlisten = await listen(‘transcode-progress’, handler);
       return () => { unlisten(); };
   }, []);
   ```

🟡 Medium Priority Issues (5)

1. [Code Organization] src/components/MainWindow.tsx
   Issue: Component spans 650 lines with excessive responsibilities
   Recommendation: Split into 4 subcomponents...

[Continue outputting other issues...]

📈 Improvement Recommendations:
- Introduce unified error-handling middleware
- Add unit tests covering critical logic
- Use ts-rs to auto-generate TypeScript types
```

---

## Notes
- Before each analysis, ask users if they have specific concerns (e.g., performance, security)
- For large files, present an overview first and ask if detailed analysis is needed
- Provide refactoring suggestions with concrete code examples, not vague descriptions
- Consider project realities and avoid over-engineering
