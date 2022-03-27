const template = `
class Gotiny < Formula
    desc "Using gotiny.cc the lightweight, fast, secure URL shortener from the command line."
    homepage "https://github.com/ndthanhdev/gotiny-cli"
    license "MIT"
    version "v1.0.0"

    on_macos do
      if Hardware::CPU.arm?
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/v0.0.18/gotiny-v0.0.18-darwin-arm64"
        sha256 "97a1590c4401f680f452a9bc20a05fbefa55b602f58ea4edb5afecb2bf4a7f65"
      else
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/v0.0.18/gotiny-v0.0.18-darwin-x64"
        sha256 "97a1590c4401f680f452a9bc20a05fbefa55b602f58ea4edb5afecb2bf4a7f65"
      end
    end

    def install
      on_macos do
        if Hardware::CPU.arm?
          bin.install "gotiny-v0.0.18-darwin-arm64" => "gotiny"
        else
          bin.install "gotiny-v0.0.18-darwin-x64" => "gotiny"
        end
      end
    end

    test do
      system bin/"gotiny", "--version"
    end
  end
`;
