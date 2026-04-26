-- Sends Jenny her live tokenized link to the receipt form.
-- Reads URL + token from environment vars LIVE_URL and ACCESS_TOKEN passed at runtime.

on run argv
    if (count of argv) < 2 then
        error "usage: osascript send-live-link.applescript <LIVE_URL> <ACCESS_TOKEN>" number 1
    end if
    set liveURL to item 1 of argv
    set accessToken to item 2 of argv
    set fullLink to liveURL & "/?t=" & accessToken

    set theSubject to "Sunrise Rescue receipt form — your live link"
    set theTo to "info@sunriserescue.com"
    set thePdfPath to "/Users/rubenmajor/Desktop/sunrise-rescue-receipt/sample/Sunrise-Rescue-sample-receipt.pdf"

    set theBody to "Hi Jenny," & return & return & ¬
        "The receipt form is live. Here is your private link:" & return & return & ¬
        fullLink & return & return & ¬
        "Bookmark it. That single URL is everything you need. No install, no terminal, no setup. Just open it in any browser and fill out the form. Each receipt:" & return & return & ¬
        "  - generates a Sunrise Rescue branded PDF with your EIN (85-1162020) on it," & return & ¬
        "  - emails it to the donor or adopter," & return & ¬
        "  - copies info@sunriserescue.com so you have a record," & return & ¬
        "  - posts the data to whatever admin or bookkeeping system you point it at." & return & return & ¬
        "I attached an updated sample PDF so you can see the layout before you use it." & return & return & ¬
        "Two pieces of info I still need from you to flip on the email + admin pieces:" & return & return & ¬
        "  1. The login for info@sunriserescue.com (so the form can send through that account, not from a generic relay). For Google Workspace it is just an app password from Google. For something else, the username and password for that provider." & return & return & ¬
        "  2. Where you want every receipt's data to land. If you already have a donor database or a Google Sheet or QuickBooks, tell me what it is. If you do not have one, I can build a simple dashboard that shows every receipt the form has generated, sortable by date, donor, amount." & return & return & ¬
        "Until you send those, the form still works. PDFs are saved on the server and you can pull a copy from any receipt's success message. As soon as you reply with those two things, the email and bookkeeping pieces flip on." & return & return & ¬
        "Reply back if the link does not work or if anything in the form should change. Easy to adjust." & return & return & ¬
        "Thanks," & return & ¬
        "Ruben"

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
    return "sent: " & fullLink
end run
