import collections, re
DROP = {
"https://sqlbolt.org/","https://thinkingwithtype.com/","https://openmusictheory.com/","https://inkscape.org/learn/tutorials/",
"https://www.adobe.com/express/learn/","https://helpx.adobe.com/lightroom-classic/help/tutorials.html","https://helpx.adobe.com/premiere-pro/tutorials.html",
"https://learn.usa.canon.com/","https://www.socialmediaexaminer.com/","https://www.bhphotovideo.com/explora/photography","https://vimeo.com/school",
"https://support.apple.com/guide/garageband-mac/welcome/mac","https://www.musictheoryacademy.com/","https://apprendre.tv5monde.com/en",
"https://www.moneyhelper.org.uk/","https://www.bogleheads.org/wiki/Main_Page","https://consumer.ftc.gov/","https://www.exploratorium.edu/cooking",
"https://www.foodsafety.gov/","https://www.myplate.gov/","https://www.seriouseats.com/the-food-lab","https://www.budgetbytes.com/",
"https://www.youtube.com/@AdamRagusea","https://www.cdc.gov/physicalactivity/basics/index.htm","https://www.cdc.gov/physical-activity-basics/index.html",
"https://www.nhs.uk/conditions/nhs-couch-to-5k/","https://owl.purdue.edu/owl/general_writing/speech_and_presentation_resources/index.html",
"https://owl.purdue.edu/owl/creative_writing/index.html","https://www.youtube.com/@BrandonSanderson","https://linuxjourney.com/",
"https://www.tensorflow.org/tutorials","https://www.w3.org/WAI/fundamentals/","https://www.mindtools.com/pages/main/newMN_CSS.htm",
"https://www.canva.com/designschool/","https://inclusivedesignprinciples.org/","https://mode.com/sql-tutorial/","https://www.kodak.com/en/consumer/learn/... ",
"https://www.youtube.com/@ThomasHeaton","https://www.youtube.com/@StuckInCustoms","https://www.youtube.com/@FstoppersVideo",
"https://www.coursera.org/","https://www.edx.org/",
"https://photographyconcentrate.com/","https://www.kenrockwell.com/tech/index.htm","https://www.ted.com/about/programs-initiatives/ted-speaking-guide",
"https://www.skillsyouneed.com/presentation.html","https://www.youtube.com/@ToastmastersInternational","https://www.fitness.gov/",
"https://www.acefitness.org/education-and-resources/","https://www.investor.gov/introduction-investing/getting-started","https://www.youtube.com/@AbletonLearn",
"https://www.youtube.com/@ProHomeCooks","https://forvo.com/","https://rpstrength.com/blogs/articles","https://www.digitalcameraworld.com/tutorials","https://www.ted.com/talks/chris_anderson_ted_s_secret_to_a_great_public_talk",
"https://www.youtube.com/@ThomasHeaton","https://www.youtube.com/@programmingwithmosh/x",
"https://www.khanacademy.org/x",
}
REPLACE = {"https://www.canva.com/designschool/": "https://www.canva.com/design-school/"}
FORMAT_FIX = {"https://writingexcuses.com/": "podcast"}
rows=[]; seen=set()
for f in ["candidates-1.tsv","candidates-2.tsv","candidates-3.tsv","candidates-4.tsv","candidates-5.tsv","candidates-6.tsv"]:
    try: lines=open(f).read().splitlines()
    except FileNotFoundError: continue
    for l in lines:
        p=l.split("|")
        if len(p)<9: continue
        cat,title,plat,url,fmt,diff,hrs,tags,desc=p[:9]
        if url in DROP: continue
        url=REPLACE.get(url,url)
        if url in seen: continue
        seen.add(url)
        fmt=FORMAT_FIX.get(url,fmt)
        rows.append(dict(cat=cat,title=title,plat=plat,url=url,fmt=fmt,diff=diff,hrs=hrs,tags=tags,desc=desc,file=f))
open("final.tsv","w").write("\n".join("|".join([r['cat'],r['title'],r['plat'],r['url'],r['fmt'],r['diff'],r['hrs'],r['tags'],r['desc']]) for r in rows)+"\n")
c=collections.Counter(r['cat'] for r in rows)
for k in ["programming","web-development","data-science","ai-ml","ui-ux-design","graphic-design","digital-marketing","photography","video-editing","music-production","foreign-languages","personal-finance","cooking","fitness","public-speaking","creative-writing","cybersecurity","cloud-computing"]:
    print(f"{k:20s} {c[k]}")
print("total", len(rows))
