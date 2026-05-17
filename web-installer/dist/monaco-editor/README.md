# Monaco Editor - YAML Only Version

This is a streamlined version of Monaco Editor that only retains YAML format support.

## Included Files

### Core Editor Files
- `vs/editor/editor.main.js` - Main editor JavaScript file
- `vs/editor/editor.main.css` - Main editor stylesheet
- `vs/loader.js` - AMD module loader

### Worker Files
- `vs/base/worker/workerMain.js` - Web Worker main file

### Icon Fonts
- `vs/base/browser/ui/codicons/codicon/codicon.ttf` - Editor icon font

### YAML Language Support
- `vs/basic-languages/yaml/yaml.js` - YAML syntax highlighting and language features

### Localization Files
- `vs/nls.messages.zh-cn.js` - Chinese interface localization file

## Removed Content

To reduce file size, the following content has been removed:
- All other programming language support (80+ languages)
- Advanced language services (CSS, HTML, JSON, TypeScript)
- Unnecessary system files

## Directory Size

The streamlined directory size is approximately 4.4MB, significantly reduced compared to the full version.

## Usage

This streamlined version can be directly used in projects that only require YAML editing functionality.