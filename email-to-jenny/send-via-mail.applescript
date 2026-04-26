-- Sends the Sunrise Rescue receipt email to Jenny via Apple Mail.
-- Attaches the sample PDF and the Playwright/how-to-use instructions.

set theSubject to "Sunrise Rescue — receipt form + sample PDF + how-to-use guide"
set theTo to "info@sunriserescue.com"
set theBodyFile to "/Users/rubenmajor/Desktop/sunrise-rescue-receipt/email-to-jenny/email-body.md"
set thePdfPath to "/Users/rubenmajor/Desktop/sunrise-rescue-receipt/sample/Sunrise-Rescue-sample-receipt.pdf"
set theMdPath to "/Users/rubenmajor/Desktop/sunrise-rescue-receipt/PLAYWRIGHT-INSTRUCTIONS.md"

-- Read body, strip the meta header (everything before and including the first '---' line)
set rawBody to read (POSIX file theBodyFile) as «class utf8»
set delim to "---" & linefeed
set AppleScript's text item delimiters to delim
set parts to text items of rawBody
set AppleScript's text item delimiters to ""
if (count of parts) > 1 then
    set bodyTextItems to items 2 thru -1 of parts
    set AppleScript's text item delimiters to delim
    set theBody to bodyTextItems as text
    set AppleScript's text item delimiters to ""
else
    set theBody to rawBody
end if

-- Trim leading whitespace/newlines
repeat while (theBody starts with linefeed) or (theBody starts with return) or (theBody starts with " ") or (theBody starts with tab)
    set theBody to text 2 thru -1 of theBody
end repeat

tell application "Mail"
    set newMsg to make new outgoing message with properties {subject:theSubject, content:theBody, visible:true}
    tell newMsg
        make new to recipient at end of to recipients with properties {address:theTo}
        tell content
            make new attachment with properties {file name:(POSIX file thePdfPath as alias)} at after the last paragraph
            make new attachment with properties {file name:(POSIX file theMdPath as alias)} at after the last paragraph
        end tell
        delay 1
        send
    end tell
end tell

return "sent"
