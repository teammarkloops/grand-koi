// src/config/categories.ts

export const MAIN_CATEGORIES = [
  "Kohaku",
  "Showa",
  "Sanke",
  "Other Koi",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const SUB_CATEGORIES: Record<MainCategory, string[]> = {
  Kohaku: ["Tancho Kohaku", "Doitsu Kohaku", "Gin Rin Kohaku", "Others"],
  Showa: ["Tancho Showa", "Doitsu Showa", "Gin Rin Showa", "Others"],
  Sanke: ["Tancho Sanke", "Doitsu Sanke", "Gin Rin Sanke", "Others"],
  "Other Koi": [
    "Matsukawabake",
    "Cha Utsuri",
    "Mukashi Ogan",
    "Mizuho Ogan",
    "Black Diamond4",
    "Saragoi",
    "Kawarimono",
    "Gin Rin Asagi",
    "Benigoi30",
    "Chagoi4",
    "Goromo",
    "Goshiki4",
    "Hi Utsuri22",
    "Shiro Utsuri",
    "Ochiba",
    "Kujaku6",
    "Ki Utsuri",
    "Shusui3",
    "Platinum Ogon",
    "Matsuba",
    "Yamabuki",
    "Kikokuryu5",
    "Kawarimono7",
    "Hariwake2",
    "Kigoi",
    "Kabuto1",
    "Kumonryu",
  ],
};

export const SEX_OPTIONS = ["Male", "Female"] as const;

export const BREEDER_OPTIONS = [
  "Dainichi",
  "Hiroi",
  "Hoshikin",
  "Ikarashi",
  "Isa",
  "Kaneko",
  "Koda",
  "Konishi",
  "Marudo",
  "Maruhiro",
  "Maruju",
  "Marusei",
  "Max Koi Farm",
  "Miyatora",
  "Momotaro",
  "Omosako",
  "Otsuka",
] as const;
