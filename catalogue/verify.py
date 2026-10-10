import sys, subprocess, re, concurrent.futures as cf, html

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

def check(url):
    try:
        out = subprocess.run(
            ["curl", "-sL", "--compressed", "--max-time", "20", "-A", UA, "-w", "\n@@%{http_code}|%{url_effective}", url],
            capture_output=True, timeout=30).stdout.decode("utf-8", "replace")
    except Exception as e:
        return url, "ERR", "", str(e)
    body, _, tail = out.rpartition("\n@@")
    code, _, eff = tail.partition("|")
    m = re.search(r"<title[^>]*>(.*?)</title>", body, re.S | re.I)
    title = html.unescape(m.group(1).strip())[:90] if m else ""
    low = body.lower()
    flags = []
    for pat in ["free trial", "start your free", "sign in to continue", "log in to continue", "just a moment", "captcha", "are you a robot", "access denied"]:
        if pat in low:
            flags.append(pat)
    return url, code, eff, title + (" [flags: " + ",".join(flags) + "]" if flags else "")

if __name__ == "__main__":
    urls = [l.split("|")[3] for l in open(sys.argv[1]) if l.strip() and l.count("|") >= 8]
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        for url, code, eff, info in ex.map(check, urls):
            print(f"{code}\t{url}\t->{eff}\t{info}")
