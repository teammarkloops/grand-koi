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
    "Black Diamond",
    "Saragoi",
    "Kawarimono",
    "Gin Rin Asagi",
    "Benigoi",
    "Chagoi",
    "Goromo",
    "Goshiki",
    "Hi Utsuri",
    "Shiro Utsuri",
    "Ochiba",
    "Kujaku",
    "Ki Utsuri",
    "Shusui",
    "Platinum Ogon",
    "Matsuba",
    "Yamabuki",
    "Kikokuryu",
    "Kawarimono",
    "Hariwake",
    "Kigoi",
    "Kabuto",
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
  "Sakai",
  "Sakazume",
  "Shinoda",
  "Torazo",
  "Yamamatsu Koi farm",
] as const;
