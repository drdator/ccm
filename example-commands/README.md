# Hello World Commands

This is an example CCM command set for testing the Claude Command Manager.

## Commands Included

- **hello.md** - A simple hello world command
- **greet.md** - Personalized greeting command (takes arguments)
- **explain.md** - Explains code or concepts simply (takes arguments)

## Usage

### To publish this command set:

```bash
cd example-commands
ccm publish
```

### To install and use these commands:

```bash
cd your-project
ccm install hello-world
```

Then in Claude Code:
- `/hello-world/hello` - Simple hello
- `/hello-world/greet Alice` - Greet Alice
- `/hello-world/explain recursion` - Explain recursion

## Testing

This command set is designed to test:
- Basic command publishing
- Commands with and without arguments
- Namespaced command access
- Package installation and symlinking