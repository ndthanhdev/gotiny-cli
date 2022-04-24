package gotinyMisc

import (
	"dagger.io/dagger"
	"dagger.io/dagger/core"
	"universe.dagger.io/alpine"
	"universe.dagger.io/bash"
	"universe.dagger.io/docker"
)

dagger.#Plan & {
	client: {
		filesystem: {
			"../../": read: {
					contents: dagger.#FS,
					exclude: [
						"node_modules",
						"out",
					]
				}

			"../../out": write: contents: actions.build.contents.output

			// "../../out": write: contents: actions.chocoPack.contents.output
		}
		env: {
			GITHUB_TOKEN: dagger.#Secret
			CHOCO_TOKEN: dagger.#Secret
		}
	}

	_rootDir: client.filesystem."../../"

	actions: {
		deps: docker.#Build & {
			steps: [
				alpine.#Build & {
					packages: {
						bash: {}
						git: {}
						nodejs: {}
						yarn: {}
						go: {}
					}
				},
				bash.#Run & {
					script: contents: #"""
						yarn global add zx
					"""#
				},
				docker.#Copy & {
					contents: _rootDir.read.contents
					dest:     "/src"
				},
				bash.#Run & {
					workdir: "/src"
					mounts: {
						// _nodeModulesMount
					}
					script: contents: #"""
						yarn install
					"""#
				},
			]
		}

		build: {
			run: bash.#Run & {
				input: deps.output
				workdir: "/src"
				script: contents: #"""
					zx ./misc/scripts/build.mjs
				"""#
			}

			contents: core.#Subdir & {
				input: run.output.rootfs
				path:  "/src/out"
			}
		}

		chocoPack: {
			_image: docker.#Build & {
				steps: [
					docker.#Pull & {
						source: "chocolatey/choco"
					},
					docker.#Copy & {
						contents: build.contents.output
						dest:     "/src/out"
					},
					bash.#Run & {
						script: contents: #"""
							curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

							source /root/.bashrc

							nvm install 18

							nvm alias default 18

							npm i -g yarn
						"""#
					},
				]
			}

			pack: bash.#Run & {
				input: _image.output
				mounts: {
					"/src": {
						type: "fs"
						dest: "/src",
						contents: _rootDir.read.contents
					}
				}
				workdir: "/src"
				script: contents: #"""
					source /root/.bashrc

					node -v

					yarn --version
					
				"""#
			}

			contents: core.#Subdir & {
				input: pack.output.rootfs
				path:  "/src/out"
			}
		}

		// chocoRelease: {
			
		// }

		// release: {

		// }
	}
}
