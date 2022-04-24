$ErrorActionPreference = 'Stop';
$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  packageVersion = $env:chocolateyPackageVersion
}

if ($arch -eq 32) {
  $binFile = "$toolsDir\$($packageArgs.packageName)-386.exe"
}
else {
  $binFile = "$toolsDir\$($packageArgs.packageName)-amd64.exe"
}

Uninstall-BinFile $packageArgs.packageName $binFile
