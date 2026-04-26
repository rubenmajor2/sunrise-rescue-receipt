-- Sends the follow-up email to Jenny with the updated EIN-stamped sample PDF.

set theSubject to "Sunrise Rescue receipt form — updated PDF (with EIN) + answer to your question"
set theTo to "info@sunriserescue.com"
set theBodyFile to "/Users/rubenmajor/Desktop/sunrise-rescue-receipt/email-to-jenny/followup-body.txt"
set thePdfPath to "/Users/rubenmajor/Desktop/sunrise-rescue-receipt/sample/Sunrise-Rescue-sample-receipt.pdf"

set theBody to (read (POSIX file theBodyFile) as «class utf8»)

tell application "Mail"
    set newMsg to make new outgoing message with properties {subject:theSubject, content:theBody, visible:true}
    tell newMsg
        make new to recipient at end of to recipients with properties {address:theTo}
        tell content
            make new attachment with properties {file name:(POSIX file thePdfPath as alias)} at after the last paragraph
        end tell
        delay 1
        send
    end tell
end tell

return "sent"
