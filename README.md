# Bodi Properties — Studio Admin

Бэлэн ажиллах **Next.js 15 + shadcn/ui + Tiptap** admin dashboard.
Нэг super admin — мэдээ (News), төслүүд (Projects), нүүр хуудасны зураг (Home images)-ыг удирдана.

## Ажиллуулах (3 алхам)

```bash
npm install --legacy-peer-deps
npm run dev
```

Дараа нь нээ: **http://localhost:3000** → `/admin` → `/admin/login`

> `--legacy-peer-deps` нь npm + React 19-ийн peer зөрчлийн улмаас хэрэгтэй.
> Хэрэв нүүр сайт чинь мөн 3000 порт дээр байвал: `npm run dev -- -p 3001`

## Backend холболт

`.env.local` дотор backend хаягаа зааж өгнө (анхдагч нь localhost:4000):

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Backend-ээ асааж, login дээр `ADMIN_EMAIL` / `ADMIN_PASSWORD`-оор нэвтэрнэ.

## Хэсгүүд
- **Overview** — projects / news / draft тоо
- **Projects** — хүснэгт + нэмэх/засах (gallery, detail зэрэг бүх талбар)
- **News** — хүснэгт + EN/MN tab, агуулга бүрд **Tiptap** editor, published toggle
- **Home images** — нүүрний зургийн slot-ууд (URL солих, нэмэх/устгах)

## Тэмдэглэл
- **Home images** хэсэг ажиллахын тулд backend-д `/api/home-images` endpoint
  байх ёстой (өмнө өгсөн `backend-home-images` файлуудыг backend repo-доо нэмж,
  `npm run seed` ажиллуулаарай).
- Tiptap нь HTML хадгална. Public news хуудсан дээр `dangerouslySetInnerHTML`-ээр
  render хийнэ (API-аас `?lang=mn|en` авбал нэг хэлээр string ирнэ).
- shadcn компонентууд `components/ui/`-д шингэсэн тул нэмэлт CLI алхам шаардлагагүй.
