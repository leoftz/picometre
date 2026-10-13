
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "cocktail_ingredients": {
                  Row: {
                    "abv": number,"drink_type": string,"ethanol_g": number | null,"id": string,"party_drink_id": string,"volume_ml": number
                  }
                  ComputedFields: never
                  Insert: {
                    "abv": number,"drink_type": string,"ethanol_g"?: never,"id"?: string,"party_drink_id": string,"volume_ml": number
                  }
                  Update: {
                    "abv"?: number,"drink_type"?: string,"ethanol_g"?: never,"id"?: string,"party_drink_id"?: string,"volume_ml"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "cocktail_ingredients_drink_type_fkey"
      columns: ["drink_type"]
isOneToOne: false
      referencedRelation: "drink_types"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "cocktail_ingredients_party_drink_id_fkey"
      columns: ["party_drink_id"]
isOneToOne: false
      referencedRelation: "party_drinks"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "granted_at": string,"id": number,"kind": Database["public"]['Enums']["consent_kind"],"party_id": string | null,"revoked_at": string | null,"user_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"id"?: never,"kind": Database["public"]['Enums']["consent_kind"],"party_id"?: string | null,"revoked_at"?: string | null,"user_id"?: string,"version": string
                  }
                  Update: {
                    "granted_at"?: string,"id"?: never,"kind"?: Database["public"]['Enums']["consent_kind"],"party_id"?: string | null,"revoked_at"?: string | null,"user_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_party_id_fkey"
      columns: ["party_id"]
isOneToOne: false
      referencedRelation: "parties"
      referencedColumns: ["id"]
    }
                  ]
                },"consumptions": {
                  Row: {
                    "abv": number | null,"consumed_at": string,"created_at": string,"ethanol_g": number,"glass_size": string | null,"id": string,"is_water": boolean,"label": string,"party_drink_id": string | null,"party_id": string,"portion": number,"pour": Database["public"]['Enums']["pour_kind"],"user_id": string,"volume_ml": number
                  }
                  ComputedFields: never
                  Insert: {
                    "abv"?: number | null,"consumed_at"?: string,"created_at"?: string,"ethanol_g"?: number,"glass_size"?: string | null,"id": string,"is_water"?: boolean,"label"?: string,"party_drink_id"?: string | null,"party_id": string,"portion"?: number,"pour"?: Database["public"]['Enums']["pour_kind"],"user_id"?: string,"volume_ml"?: number
                  }
                  Update: {
                    "abv"?: number | null,"consumed_at"?: string,"created_at"?: string,"ethanol_g"?: number,"glass_size"?: string | null,"id"?: string,"is_water"?: boolean,"label"?: string,"party_drink_id"?: string | null,"party_id"?: string,"portion"?: number,"pour"?: Database["public"]['Enums']["pour_kind"],"user_id"?: string,"volume_ml"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "consumptions_glass_size_fkey"
      columns: ["glass_size"]
isOneToOne: false
      referencedRelation: "glass_sizes"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "consumptions_party_drink_id_fkey"
      columns: ["party_drink_id"]
isOneToOne: false
      referencedRelation: "party_drinks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consumptions_party_id_fkey"
      columns: ["party_id"]
isOneToOne: false
      referencedRelation: "parties"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consumptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"drink_type_glasses": {
                  Row: {
                    "drink_type": string,"glass_size": string,"is_default": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "drink_type": string,"glass_size": string,"is_default"?: boolean
                  }
                  Update: {
                    "drink_type"?: string,"glass_size"?: string,"is_default"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "drink_type_glasses_drink_type_fkey"
      columns: ["drink_type"]
isOneToOne: false
      referencedRelation: "drink_types"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "drink_type_glasses_glass_size_fkey"
      columns: ["glass_size"]
isOneToOne: false
      referencedRelation: "glass_sizes"
      referencedColumns: ["slug"]
    }
                  ]
                },"drink_types": {
                  Row: {
                    "abv_default": number,"abv_max": number,"abv_min": number,"family": Database["public"]['Enums']["drink_family"],"label": string,"param_ref": string,"slug": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "abv_default": number,"abv_max": number,"abv_min": number,"family": Database["public"]['Enums']["drink_family"],"label": string,"param_ref": string,"slug": string,"sort": number
                  }
                  Update: {
                    "abv_default"?: number,"abv_max"?: number,"abv_min"?: number,"family"?: Database["public"]['Enums']["drink_family"],"label"?: string,"param_ref"?: string,"slug"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"friend_invites": {
                  Row: {
                    "created_at": string,"expires_at": string,"inviter_id": string,"token": string,"used_at": string | null,"used_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string,"inviter_id"?: string,"token"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"inviter_id"?: string,"token"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "friend_invites_inviter_id_fkey"
      columns: ["inviter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friend_invites_used_by_fkey"
      columns: ["used_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"friendships": {
                  Row: {
                    "addressee_id": string,"created_at": string,"id": string,"requester_id": string,"responded_at": string | null,"status": Database["public"]['Enums']["friendship_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "addressee_id": string,"created_at"?: string,"id"?: string,"requester_id": string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["friendship_status"]
                  }
                  Update: {
                    "addressee_id"?: string,"created_at"?: string,"id"?: string,"requester_id"?: string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["friendship_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "friendships_addressee_id_fkey"
      columns: ["addressee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friendships_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"gauge_shares": {
                  Row: {
                    "computed_at": string,"id": string,"level": number,"party_id": string,"peak_level": number,"schedule": NonNullable<Json>,"stopped": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "computed_at"?: string,"id"?: string,"level": number,"party_id": string,"peak_level"?: number,"schedule"?: NonNullable<Json>,"stopped"?: boolean,"user_id"?: string
                  }
                  Update: {
                    "computed_at"?: string,"id"?: string,"level"?: number,"party_id"?: string,"peak_level"?: number,"schedule"?: NonNullable<Json>,"stopped"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gauge_shares_party_id_user_id_fkey"
      columns: ["party_id","user_id"]
isOneToOne: true
      referencedRelation: "party_participants"
      referencedColumns: ["party_id","user_id"]
    }
                  ]
                },"glass_sizes": {
                  Row: {
                    "label": string,"param_ref": string,"slug": string,"volume_ml": number
                  }
                  ComputedFields: never
                  Insert: {
                    "label": string,"param_ref": string,"slug": string,"volume_ml": number
                  }
                  Update: {
                    "label"?: string,"param_ref"?: string,"slug"?: string,"volume_ml"?: number
                  }
                  Relationships: [
                    
                  ]
                },"participant_private": {
                  Row: {
                    "meal_at": string | null,"meal_kind": Database["public"]['Enums']["meal_kind"] | null,"objective": Database["public"]['Enums']["party_objective"] | null,"party_id": string,"stop_locked_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "meal_at"?: string | null,"meal_kind"?: Database["public"]['Enums']["meal_kind"] | null,"objective"?: Database["public"]['Enums']["party_objective"] | null,"party_id": string,"stop_locked_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "meal_at"?: string | null,"meal_kind"?: Database["public"]['Enums']["meal_kind"] | null,"objective"?: Database["public"]['Enums']["party_objective"] | null,"party_id"?: string,"stop_locked_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "participant_private_party_id_user_id_fkey"
      columns: ["party_id","user_id"]
isOneToOne: true
      referencedRelation: "party_participants"
      referencedColumns: ["party_id","user_id"]
    }
                  ]
                },"parties": {
                  Row: {
                    "created_at": string,"ended_at": string | null,"host_id": string,"id": string,"location": string | null,"starts_at": string,"status": Database["public"]['Enums']["party_status"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ended_at"?: string | null,"host_id"?: string,"id"?: string,"location"?: string | null,"starts_at": string,"status"?: Database["public"]['Enums']["party_status"],"title": string
                  }
                  Update: {
                    "created_at"?: string,"ended_at"?: string | null,"host_id"?: string,"id"?: string,"location"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["party_status"],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "parties_host_id_fkey"
      columns: ["host_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"party_drinks": {
                  Row: {
                    "abv": number | null,"added_by": string | null,"created_at": string,"default_glass": string | null,"drink_type": string | null,"ethanol_g": number,"id": string,"kind": Database["public"]['Enums']["planned_drink_kind"],"name": string | null,"party_id": string,"pour": Database["public"]['Enums']["pour_kind"]
                  }
                  ComputedFields: never
                  Insert: {
                    "abv"?: number | null,"added_by"?: string | null,"created_at"?: string,"default_glass"?: string | null,"drink_type"?: string | null,"ethanol_g"?: number,"id"?: string,"kind": Database["public"]['Enums']["planned_drink_kind"],"name"?: string | null,"party_id": string,"pour"?: Database["public"]['Enums']["pour_kind"]
                  }
                  Update: {
                    "abv"?: number | null,"added_by"?: string | null,"created_at"?: string,"default_glass"?: string | null,"drink_type"?: string | null,"ethanol_g"?: number,"id"?: string,"kind"?: Database["public"]['Enums']["planned_drink_kind"],"name"?: string | null,"party_id"?: string,"pour"?: Database["public"]['Enums']["pour_kind"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "party_drinks_added_by_fkey"
      columns: ["added_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "party_drinks_default_glass_fkey"
      columns: ["default_glass"]
isOneToOne: false
      referencedRelation: "glass_sizes"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "party_drinks_drink_type_fkey"
      columns: ["drink_type"]
isOneToOne: false
      referencedRelation: "drink_types"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "party_drinks_party_id_fkey"
      columns: ["party_id"]
isOneToOne: false
      referencedRelation: "parties"
      referencedColumns: ["id"]
    }
                  ]
                },"party_participants": {
                  Row: {
                    "invite_status": Database["public"]['Enums']["invite_status"],"joined_at": string | null,"party_id": string,"role": Database["public"]['Enums']["participant_role"],"share_gauge": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "invite_status"?: Database["public"]['Enums']["invite_status"],"joined_at"?: string | null,"party_id": string,"role"?: Database["public"]['Enums']["participant_role"],"share_gauge"?: boolean,"user_id": string
                  }
                  Update: {
                    "invite_status"?: Database["public"]['Enums']["invite_status"],"joined_at"?: string | null,"party_id"?: string,"role"?: Database["public"]['Enums']["participant_role"],"share_gauge"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "party_participants_party_id_fkey"
      columns: ["party_id"]
isOneToOne: false
      referencedRelation: "parties"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "party_participants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_cards": {
                  Row: {
                    "avatar": string,"id": string,"pseudo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar": string,"id": string,"pseudo": string
                  }
                  Update: {
                    "avatar"?: string,"id"?: string,"pseudo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_cards_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_health": {
                  Row: {
                    "habit": Database["public"]['Enums']["drinking_habit"],"height_cm": number,"sex": Database["public"]['Enums']["sex"],"updated_at": string,"user_id": string,"weight_kg": number
                  }
                  ComputedFields: never
                  Insert: {
                    "habit": Database["public"]['Enums']["drinking_habit"],"height_cm": number,"sex": Database["public"]['Enums']["sex"],"updated_at"?: string,"user_id"?: string,"weight_kg": number
                  }
                  Update: {
                    "habit"?: Database["public"]['Enums']["drinking_habit"],"height_cm"?: number,"sex"?: Database["public"]['Enums']["sex"],"updated_at"?: string,"user_id"?: string,"weight_kg"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_health_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "adult_confirmed_at": string,"avatar": string,"birth_year": number,"created_at": string,"id": string,"pseudo": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "adult_confirmed_at"?: string,"avatar": string,"birth_year": number,"created_at"?: string,"id"?: string,"pseudo": string,"updated_at"?: string
                  }
                  Update: {
                    "adult_confirmed_at"?: string,"avatar"?: string,"birth_year"?: number,"created_at"?: string,"id"?: string,"pseudo"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"trophies": {
                  Row: {
                    "awarded_at": string,"id": number,"kind": Database["public"]['Enums']["trophy_kind"],"party_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "awarded_at"?: string,"id"?: never,"kind": Database["public"]['Enums']["trophy_kind"],"party_id": string,"user_id": string
                  }
                  Update: {
                    "awarded_at"?: string,"id"?: never,"kind"?: Database["public"]['Enums']["trophy_kind"],"party_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trophies_party_id_user_id_fkey"
      columns: ["party_id","user_id"]
isOneToOne: false
      referencedRelation: "party_participants"
      referencedColumns: ["party_id","user_id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_friend_invite":
{ Args: { "p_token": string }; Returns: string
                           },
"claim_landing_trophy":
{ Args: { "p_party_id": string }; Returns: boolean
                           },
"has_active_consent":
{ Args: { "p_kind": Database["public"]['Enums']["consent_kind"] }; Returns: boolean
                           },
"send_friend_request":
{ Args: { "p_pseudo": string }; Returns: string
                           }
          }
          Enums: {
            "consent_kind": "cgu"|"health_data"|"gauge_sharing","drink_family": "biere"|"cidre"|"vin"|"aperitif"|"spiritueux"|"liqueur"|"sans_alcool","drinking_habit": "occasionnel"|"regulier"|"frequent","friendship_status": "pending"|"accepted"|"declined","invite_status": "invited"|"accepted"|"declined","meal_kind": "aucun"|"collation"|"repas","participant_role": "host"|"guest","party_objective": "desinhibe"|"zero_gdb"|"festive","party_status": "planned"|"live"|"ended","planned_drink_kind": "boisson"|"cocktail","pour_kind": "dose"|"oeil","sex": "f"|"m"|"autre","trophy_kind": "capitaine"|"joker_eau"|"atterrissage"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "consent_kind": ["cgu", "health_data", "gauge_sharing"],"drink_family": ["biere", "cidre", "vin", "aperitif", "spiritueux", "liqueur", "sans_alcool"],"drinking_habit": ["occasionnel", "regulier", "frequent"],"friendship_status": ["pending", "accepted", "declined"],"invite_status": ["invited", "accepted", "declined"],"meal_kind": ["aucun", "collation", "repas"],"participant_role": ["host", "guest"],"party_objective": ["desinhibe", "zero_gdb", "festive"],"party_status": ["planned", "live", "ended"],"planned_drink_kind": ["boisson", "cocktail"],"pour_kind": ["dose", "oeil"],"sex": ["f", "m", "autre"],"trophy_kind": ["capitaine", "joker_eau", "atterrissage"]
          }
        }
} as const
