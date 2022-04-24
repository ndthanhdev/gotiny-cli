# gotiny-cli

*A lightweight cli url shortener*

Using [gotiny.cc](https://gotiny.cc) the lightweight, fast, secure URL shortener from the command line.

## Installation

**Windows:**  
```bash
choco install gotiny -y
```

**MacOS:**
```bash
brew tap ndthanhdev/tap
brew install gotiny
```

**Linux:**  
Via binary, apt (planned)

## Usage

**Simple:**  
```
gotiny google.com
https://gotiny.cc/xxxxxx
```

**Copy to clipboard:**  
```
gotiny -c google.com
https://gotiny.cc/xxxxxx
Copied to clipboard!
```

**Custom code:**  
```
gotiny google.com -l abcdef
https://gotiny.cc/abcdef
```

**Help:**  
```
gotiny -h
```
