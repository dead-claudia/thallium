@echo off
cd
:loop
IF NOT "%~1"=="" (
    ECHO %1
    SHIFT
    GOTO :loop
)
"%PROGRAM%" "%BINARY%"
