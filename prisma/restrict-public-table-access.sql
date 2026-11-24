-- Server-side Prisma access only.
BEGIN;
REVOKE ALL PRIVILEGES ON TABLE public."User", public."Session", public."Dish", public."DishWish", public."Rating", public."Restaurant", public."UserDishPreference", public."CuisineWish" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Dish" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DishWish" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Rating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Restaurant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserDishPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CuisineWish" ENABLE ROW LEVEL SECURITY;
COMMIT;
