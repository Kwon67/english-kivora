ALTER TABLE "public"."assignments" DROP CONSTRAINT IF EXISTS "assignments_user_id_assigned_date_pack_id_key";
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_user_id_assigned_date_pack_id_game_mode_key" UNIQUE ("user_id", "assigned_date", "pack_id", "game_mode");;
