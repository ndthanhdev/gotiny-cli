$ErrorActionPreference = 'Stop';
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"

$arch = Get-OSArchitectureWidth

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

Install-BinFile $packageArgs.packageName $binFile
