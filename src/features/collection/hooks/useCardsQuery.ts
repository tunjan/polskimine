import Dexie from "dexie";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { db } from "@/db/dexie";
import { getCurrentUserId, searchCards } from "@/db/repositories/cardRepository";
import { Card } from "@/types";

export interface CardFilters {
  status?: string | "all";   type?: number | "all";
  bookmarked?: boolean;
  leech?: boolean;
}

export const useCardsQuery = (
  page = 0,
  pageSize = 50,
  searchTerm = "",
  filters: CardFilters = {},
) => {
  const { language } = useSettingsStore();

  return useQuery({
    queryKey: ["cards", language, page, pageSize, searchTerm, filters],
    queryFn: async () => {
              let typeFilter: number | undefined;
       if (filters.type !== undefined && filters.type !== "all") {
         typeFilter = filters.type as number;
       }
       
       return searchCards(language, page, pageSize, searchTerm, {
           type: typeFilter,
           bookmarked: filters.bookmarked,
           leech: filters.leech
       });
    },
    placeholderData: keepPreviousData,
  });
};
