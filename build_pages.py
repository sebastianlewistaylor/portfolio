import os

BASE = 'https://cdn.myportfolio.com/8bfe06f3-7238-48ee-935c-b9d18e79a858/'

PROJECTS = [
  {
    'slug': 'justin-mead-maxon',
    'title': 'Justin Mead Maxon',
    'subtitle': 'Identity in Motion',
    'color': '#c9a96e',
    'year': '2024–2025',
    'client': 'Justin Mead Maxon',
    'disciplines': 'Graphic Design, Art Direction, Identity',
    'body': 'A sustained creative partnership built around the practice of a photographer, artist, and educator working from the edges of Humboldt County. The work extends across pitch development, portfolio systems, and visual identity — each piece calibrated to the specific gravity of Justin\'s gaze and the institutional weight his practice demands.',
    'images': [
      '3fa0aae4-5efc-44b5-84e2-113781f26915_rw_1920.jpg?h=e61cda3c1f405a0a15bb449194ef89bc',
      '10b9e82c-d56a-4ad7-86d4-aac866cf1474_rw_1920.jpg?h=c10cc8d9b7af0fd35186f6e5c0a882e2',
      '1c568073-6862-4f42-95a5-f797ab25bb7a_rw_1920.jpg?h=c880bbfe529493480444eb966094781b',
      '249123f6-d206-4282-994f-9271e8ee23f6_rw_1920.jpg?h=714b611d91107883a45ac235a033470b',
    ],
    'prev': 'digital-lab-cal-poly', 'next': 'internet-journal',
    'prev_title': 'Digital Laboratory', 'next_title': 'Internet Journal',
  },
  {
    'slug': 'internet-journal',
    'title': 'Internet Journal',
    'subtitle': 'The Institution, Redefined',
    'color': '#7ab3d4',
    'year': '2023–2025',
    'client': 'Digital Laboratory',
    'disciplines': 'Brand Identity, Editorial Design, Publishing, Art Direction',
    'role': 'Founder, Editor-in-Chief',
    'body': 'Founded as a counter-institution within the publishing landscape, Internet Journal channels the energy of an underground with the rigour of academic practice. Built from scratch — identity, editorial framework, engagement infrastructure — to create a platform where nontraditional expertise holds weight. Contributors have included Playlab Inc., conversations with Virgil Abloh, and voices from across the global art and design community.',
    'images': [
      'a3da0af9-97e7-4623-81b8-8cdfc92f060c_rw_1920.png?h=049be3f625a0ab504fc05b26f5807755',
      '0a9db4a4-6b8f-4c6b-ac19-22f949c41a84_rw_1920.png?h=3b4e66711b956373faf69be0a2feb914',
      '10a15a54-c7ff-4a5e-83e2-c045ae3dcef2_rw_1920.JPG?h=9019cb77a1444dd202208e8d816af5ce',
      '1a5ad821-00da-4c37-a9b9-3260553441e8_rw_1920.jpg?h=d6a142e23debf5fecefd61044a4d24c9',
    ],
    'prev': 'justin-mead-maxon', 'next': 'humboldt-film-festival',
    'prev_title': 'Justin Mead Maxon', 'next_title': 'Humboldt Film Festival',
  },
  {
    'slug': 'humboldt-film-festival',
    'title': 'Humboldt International Film Festival',
    'subtitle': 'A Laurel Rooted in Place',
    'color': '#c97a7a',
    'year': '2024',
    'client': 'HIFF',
    'disciplines': 'Graphic Design, Art Direction, Identity',
    'body': 'Where the traditional olive branch cedes to the Redwood — one of the last of its kind on earth. The festival identity was built around this substitution: a design decision that doubles as an act of ecological witness, placing Humboldt County at the center of its own cultural story. The laurel design system extends across all festival materials, rooting a global format in deeply local meaning.',
    'images': [
      'cf485c2c-3f5d-4a62-8553-c67b48ad322c_rw_1920.jpg?h=e5bc5533e662243da649bcece5b0ddc1',
      '01cc91bf-3377-4dec-acba-958a96132d24_rw_1920.jpg?h=f6f0d6a2aed5b605a31f720cc4d500ca',
      '06937e8d-e6f5-43a0-886d-b37c8091c6ca_rw_1920.jpg?h=fa33e7e805e8f7260c48580df9002d5e',
      '0c4dc792-90ef-4d7a-ace1-3105bc9f7011_rw_1920.jpg?h=01af7bfd49320179c30678d8bca8e477',
      '274427fe-b708-4331-9fb2-f91ed5e9e466_rw_1920.jpg?h=32196453a29df7491c5a89fa20ff2fcf',
      '75369b53-d9b1-491b-a78f-bdc5b1355a4d_rw_1920.jpg?h=220307ad00026ea9f54e88a668aa3f03',
      'b152f60a-b9a3-4892-891f-28a03bda1169_rw_1920.jpg?h=4691b4a24ea753982f08f72eaf02f010',
    ],
    'prev': 'internet-journal', 'next': 'fine-art-prints',
    'prev_title': 'Internet Journal', 'next_title': 'Fine Art Prints',
  },
  {
    'slug': 'fine-art-prints',
    'title': 'Fine Art Prints',
    'subtitle': 'FAUX™ at Scale',
    'color': '#8ecfa0',
    'year': '2023–2024',
    'client': 'FAUX™',
    'disciplines': 'Art Direction, Photography, Graphic Design',
    'body': 'Two large-format works produced under the FAUX™ banner — High Renaissance and FAUX™ Billboard — each operating at the intersection of art direction, photography, and graphic production. High Renaissance was exhibited at the Reese Bullen Gallery\'s 2024 Senior Group Exhibition. The Billboard extends that visual language into public space, treating the street as exhibition.',
    'images': [
      '41097768-2a82-4e28-8990-60884e54c29e_rw_1920.jpg?h=739215b03693331a26a97657a5d17dfe',
      '82a30df6-ebc5-492a-a22d-3b248ef9ff39_rw_1920.jpg?h=d68b541a3bd6c4f962f05220526cdbb5',
    ],
    'prev': 'humboldt-film-festival', 'next': 'ijal-morgan',
    'prev_title': 'Humboldt Film Festival', 'next_title': 'Ijal Morgan',
  },
  {
    'slug': 'ijal-morgan',
    'title': 'Ijal Morgan',
    'subtitle': 'Tired of Resting',
    'color': '#b08ec9',
    'year': '2023',
    'client': 'Ijal Morgan',
    'disciplines': 'Art Direction, Graphic Design, Video Production',
    'body': 'An album with history in its grain. The artwork for Tired of Resting was art directed to pull the listener into a referential field — the life and times of Ijal rendered in texture and archive. The accompanying music video was constructed entirely from archival footage sourced through Creative Commons and the National Archives, featuring Martin Luther King Jr. and John Baxter Taylor, the first African American Olympic gold medalist. Collectively, the project amassed over 100,000 views on Instagram.',
    'images': [
      '8b27b4eb-9029-44a6-8392-8fd57659bd2b_rw_1920.jpg?h=11a3c8c50ba43c0a6470d4c67c999f93',
      '50e18902-6f0d-46dc-9ef4-38d484fcd246_rw_1920.jpg?h=216e1902e69772e4676a95f5ba4b13c3',
    ],
    'prev': 'fine-art-prints', 'next': 'digital-lab-poster',
    'prev_title': 'Fine Art Prints', 'next_title': 'Digital Laboratory Poster',
  },
  {
    'slug': 'digital-lab-poster',
    'title': 'Digital Laboratory',
    'subtitle': 'The Print Campaign',
    'color': '#c9956e',
    'year': '2023',
    'client': 'Digital Laboratory',
    'disciplines': 'Art Direction, Graphic Design, Copywriting',
    'body': 'A deliberate anachronism: a physical print campaign deployed in the service of digital publishing. Drawing from the visual codes of vintage advertising, the campaign reintroduced the poster as a medium — proof that the urgency of a new platform is best communicated through the formats that built the last one. Print as provocation.',
    'images': [
      '6866fb92-9f30-48d6-adae-4bdfa4eda667_rw_1920.jpg?h=c8f11ed919580f89ee3403cb6fdb5fc5',
      '3d538292-7db6-485c-97cc-f3b3a7cd6593_rw_1920.jpg?h=865ad62734639fce3e3ae7c35662b862',
      'd88ad6f4-1dfa-492c-ad0f-7ca8312536bc_rw_1920.jpg?h=c77b3e928769928cf061ec9c649accd8',
    ],
    'prev': 'ijal-morgan', 'next': 'ctl-cal-poly',
    'prev_title': 'Ijal Morgan', 'next_title': 'CTL Cal Poly',
  },
  {
    'slug': 'ctl-cal-poly',
    'title': 'Center for Teaching & Learning',
    'subtitle': 'Cal Poly Humboldt',
    'color': '#6ec9c9',
    'year': '2023–2024',
    'client': 'Cal Poly Humboldt',
    'disciplines': 'Graphic Design, Design Systems, UX Research',
    'body': 'In-house design work for one of California\'s most progressive public universities. The engagement spanned events, symposia, instructional design artifacts, and identity alignment — operating within institutional brand guidelines while carving room for visual clarity and system thinking. From the Teaching Excellence Symposium to AI discussion materials, each piece carried the weight of a university in motion.',
    'images': [
      '7ce5fa5c-db33-4b15-a780-b0022bf54847_rw_1920.jpeg?h=ecd8bbf5256093338ee1f221af2c6a92',
      '0f89d491-3341-41aa-811d-f837323b5908_rw_1920.jpg?h=9e77c5a8ed7a0d4cce63f1eb4352551c',
      '26a5d314-f1ee-42a5-b079-b86638d51cea_rw_1920.jpg?h=25edeb850fc56b7e7f27252851463330',
      '3fb3f516-914f-4325-ab99-1f58006eaa0c_rw_1920.jpg?h=04431c0ca3f407fc9c094b397994b719',
      'c4624dba-8794-4f13-adb7-47946a04e8e3_rw_1920.jpg?h=fc234892cc6ac962d8d1d87b7e564109',
    ],
    'prev': 'digital-lab-poster', 'next': 'digital-lab-cal-poly',
    'prev_title': 'Digital Laboratory Poster', 'next_title': 'Digital Laboratory',
  },
  {
    'slug': 'digital-lab-cal-poly',
    'title': 'Digital Laboratory',
    'subtitle': 'Cal Poly Humboldt',
    'color': '#c9c06e',
    'year': '2022',
    'client': 'Cal Poly Humboldt',
    'disciplines': 'Brand Identity, Logo Design, System Design',
    'body': 'The founding identity for a digital publishing platform built to expand global access to academic knowledge. Established through a strategic partnership with Cal Poly Humboldt Digital Commons, Digital Laboratory was designed as an institution meant to outlast its moment — brand mark, identity system, and brand book built to carry the weight of what publishing can be when access is the premise.',
    'images': [
      '38e3c55d-eced-41c8-b008-e27c22460ae7_rw_1920.JPEG?h=3e73ed72ac2d81cf17152cf754dafbe2',
      '0bc5987e-798c-44db-aee0-e6f422b36d21_rw_1920.jpg?h=6b49785c2eb989cf7c83d4af2cffe6cc',
      '21fde9cb-6084-41f9-845d-3459cce72588_rw_1920.jpg?h=f506c3f88a87031c4c5fbc29be8f1964',
      '259c1a58-8793-4db3-9092-cd1c91f465df_rw_1920.jpg?h=870ae3521e9ccd6e706d8b659cdaa220',
      '6ff900dc-8327-45ec-9f42-e114cd7cdf5a_rw_1920.jpg?h=8cb70d0247916b718bd9b5c2d936d475',
    ],
    'prev': 'ctl-cal-poly', 'next': 'justin-mead-maxon',
    'prev_title': 'CTL Cal Poly', 'next_title': 'Justin Mead Maxon',
  },
]

TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Sebastian Taylor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://use.typekit.net/jet0drk.css">
  <style>
    :root {{
      --bg: #0c0c0c;
      --fg: #f0ede8;
      --muted: #555;
      --border: rgba(240,237,232,0.08);
      --accent: {color};
      --pad: clamp(1.5rem, 3vw, 3rem);
    }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html {{ font-size: 16px; scroll-behavior: auto; }}
    body {{
      background: var(--bg);
      color: var(--fg);
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: hidden;
      cursor: none;
    }}
    ::selection {{ background: var(--accent); color: #000; }}
    ::-webkit-scrollbar {{ width: 0; }}
    * {{ -webkit-font-smoothing: antialiased; }}

    /* Cursor */
    .cursor {{
      position: fixed; pointer-events: none; z-index: 9999;
      transform: translate(-50%,-50%); width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; color: var(--fg); line-height: 1;
      transition: font-size 0.3s cubic-bezier(0.76,0,0.24,1);
      user-select: none;
    }}
    .cursor-follower {{
      position: fixed; left: 0; top: 0; width: 80px; height: 80px;
      background: var(--accent); mix-blend-mode: difference;
      border-radius: 50%; pointer-events: none; z-index: 9998;
      transition: background 0.6s ease;
    }}
    body.cursor-hover .cursor {{ font-size: 22px; width: 80px; height: 80px; }}
    body.cursor-hover .cursor-follower {{ width: 110px; height: 110px; }}

    /* Page transition */
    #page-transition {{
      position: fixed; inset: 0; z-index: 99998;
      background: {color};
      transform: scaleX(1); transform-origin: right center;
      will-change: transform;
    }}
    #page-transition.wipe-out {{
      animation: pt-out 0.5s cubic-bezier(0.76,0,0.24,1) forwards;
    }}
    #page-transition.wipe-in {{
      pointer-events: all;
      animation: pt-in 0.42s cubic-bezier(0.76,0,0.24,1) forwards;
    }}
    @keyframes pt-out {{
      from {{ transform: scaleX(1); transform-origin: right center; }}
      to   {{ transform: scaleX(0); transform-origin: right center; }}
    }}
    @keyframes pt-in {{
      from {{ transform: scaleX(0); transform-origin: left center; }}
      to   {{ transform: scaleX(1); transform-origin: left center; }}
    }}

    /* Nav */
    .p-nav {{
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; justify-content: space-between; align-items: center;
      padding: 24px var(--pad);
      border-bottom: 1px solid var(--border);
      background: rgba(12,12,12,0.85);
      backdrop-filter: blur(12px);
    }}
    .p-nav-back {{
      font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--muted); text-decoration: none; cursor: none;
      transition: color 0.2s;
      display: flex; align-items: center; gap: 8px;
    }}
    .p-nav-back:hover {{ color: var(--fg); }}
    .p-nav-back::before {{ content: '←'; }}
    .p-nav-name {{
      font-family: 'bickham-script-pro-3', Georgia, serif;
      font-size: 1.1rem; font-style: normal; color: var(--fg);
      text-decoration: none; cursor: none;
    }}

    /* Hero */
    .p-hero {{
      width: 100%; height: 100vh;
      background: #111;
      overflow: hidden; position: relative;
    }}
    .p-hero img {{
      width: 100%; height: 100%; object-fit: cover;
      display: block;
    }}

    /* Info section */
    .p-info {{
      padding: 80px var(--pad) 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      border-bottom: 1px solid var(--border);
    }}
    .p-info-left {{}}
    .p-title {{
      font-family: 'bickham-script-pro-3', Georgia, serif;
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-style: normal;
      color: var(--fg);
      line-height: 1.1;
      margin-bottom: 8px;
    }}
    .p-subtitle {{
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 32px;
    }}
    .p-body {{
      font-size: 14px;
      line-height: 1.75;
      color: rgba(240,237,232,0.7);
      max-width: 520px;
    }}
    .p-meta {{
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-top: 8px;
    }}
    .p-meta-item {{}}
    .p-meta-label {{
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }}
    .p-meta-value {{
      font-size: 13px;
      color: var(--fg);
    }}

    /* Images */
    .p-images {{ display: flex; flex-direction: column; gap: 2px; }}
    .p-images img {{ width: 100%; display: block; }}

    /* Next project */
    .p-next {{
      display: flex; justify-content: space-between; align-items: center;
      padding: 48px var(--pad);
      border-top: 1px solid var(--border);
      cursor: none;
      text-decoration: none;
      transition: background 0.3s;
      position: relative;
      overflow: hidden;
    }}
    .p-next-bg {{
      position: absolute; inset: 0;
      background: var(--accent);
      transform: scaleX(0); transform-origin: left center;
      transition: transform 0.5s cubic-bezier(0.76,0,0.24,1);
    }}
    .p-next:hover .p-next-bg {{ transform: scaleX(1); }}
    .p-next-label {{
      font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--muted); position: relative; z-index: 1;
      transition: color 0.3s;
    }}
    .p-next:hover .p-next-label {{ color: #000; }}
    .p-next-title {{
      font-family: 'bickham-script-pro-3', Georgia, serif;
      font-size: 1.4rem; font-style: normal; color: var(--fg);
      position: relative; z-index: 1;
      transition: color 0.3s;
    }}
    .p-next:hover .p-next-title {{ color: #000; }}
    .p-next-arrow {{
      font-size: 18px; color: var(--fg); position: relative; z-index: 1;
      transition: transform 0.3s, color 0.3s;
    }}
    .p-next:hover .p-next-arrow {{ transform: translate(4px,-4px); color: #000; }}

    @media (max-width: 768px) {{
      .p-info {{ grid-template-columns: 1fr; gap: 40px; }}
    }}
  </style>
</head>
<body>

<div id="page-transition"></div>
<div class="cursor" id="cursor">®</div>
<div class="cursor-follower" id="cursorFollower"></div>

<nav class="p-nav">
  <a class="p-nav-back" href="index.html" id="back-link">Work</a>
  <a class="p-nav-name" href="index.html">Sebastian Taylor</a>
</nav>

<div class="p-hero">
  <img src="{hero}" alt="{title}" loading="eager">
</div>

<section class="p-info">
  <div class="p-info-left">
    <div class="p-title">{title}</div>
    <div class="p-subtitle">{subtitle}</div>
    <p class="p-body">{body}</p>
  </div>
  <div class="p-meta">
    <div class="p-meta-item">
      <div class="p-meta-label">Year</div>
      <div class="p-meta-value">{year}</div>
    </div>
    <div class="p-meta-item">
      <div class="p-meta-label">Client</div>
      <div class="p-meta-value">{client}</div>
    </div>
    <div class="p-meta-item">
      <div class="p-meta-label">Disciplines</div>
      <div class="p-meta-value">{disciplines}</div>
    </div>
  </div>
</section>

<div class="p-images">
{image_tags}
</div>

<a class="p-next" href="{next}.html" id="next-link">
  <div class="p-next-bg"></div>
  <div>
    <div class="p-next-label">Next Project</div>
    <div class="p-next-title">{next_title}</div>
  </div>
  <div class="p-next-arrow">↗</div>
</a>

<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script>
  // Cursor
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let fx = mx, fy = my;
  document.addEventListener('mousemove', e => {{ mx = e.clientX; my = e.clientY; }});
  document.querySelectorAll('a, button').forEach(el => {{
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  }});
  function animateCursor() {{
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    fx += (mx - fx) * 0.08; fy += (my - fy) * 0.08;
    gsap.set(follower, {{ x: fx - 40, y: fy - 40 }});
    requestAnimationFrame(animateCursor);
  }}
  animateCursor();

  // Entry transition wipe-out
  const pt = document.getElementById('page-transition');
  const savedColor = sessionStorage.getItem('pt-color') || '{color}';
  pt.style.background = savedColor;
  requestAnimationFrame(() => {{
    pt.classList.add('wipe-out');
    pt.addEventListener('animationend', () => {{
      pt.style.transform = 'scaleX(0)';
      pt.classList.remove('wipe-out');
    }}, {{once: true}});
  }});

  // Navigation with transition
  function navigateWithTransition(href, color) {{
    pt.style.background = color || '#c8c2f5';
    pt.style.transform = '';
    pt.classList.remove('wipe-out');
    pt.classList.add('wipe-in');
    sessionStorage.setItem('pt-color', color || '#c8c2f5');
    setTimeout(() => {{ window.location.href = href; }}, 440);
  }}

  document.getElementById('back-link').addEventListener('click', e => {{
    e.preventDefault();
    navigateWithTransition('index.html', '{color}');
  }});

  document.getElementById('next-link').addEventListener('click', e => {{
    e.preventDefault();
    navigateWithTransition(e.currentTarget.getAttribute('href'), '{next_color}');
  }});

  // Lenis scroll
  const lenis = new Lenis({{ lerp: 0.08 }});
  function raf(time) {{ lenis.raf(time); requestAnimationFrame(raf); }}
  requestAnimationFrame(raf);
</script>
</body>
</html>'''

# Color map for next project colors
COLOR_MAP = {{p['slug']: p['color'] for p in PROJECTS}}

out_dir = '/Users/sebtaylor/Projects/portfolio'

for p in PROJECTS:
    image_tags = '\n'.join(
        f'  <img src="{BASE}{img}" alt="" loading="lazy">'
        for img in p['images'][1:]  # skip hero (already in hero section)
    )
    next_color = COLOR_MAP.get(p['next'], '#c8c2f5')
    html = TEMPLATE.format(
        title=p['title'],
        subtitle=p['subtitle'],
        color=p['color'],
        year=p['year'],
        client=p['client'],
        disciplines=p['disciplines'],
        body=p['body'],
        hero=BASE + p['images'][0],
        image_tags=image_tags,
        next=p['next'],
        next_title=p['next_title'],
        next_color=next_color,
    )
    path = os.path.join(out_dir, p['slug'] + '.html')
    with open(path, 'w') as f:
        f.write(html)
    print(f'✓ {p["slug"]}.html')

print('\nAll pages built.')
