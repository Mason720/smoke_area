export default interface SmokingArea {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  facilities: {
    covered?: boolean;
    seating?: boolean;
    ashtray?: boolean;
    lighting?: boolean;
    shelter?: boolean;
  };
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  photos?: SmokingAreaPhoto[];
  distance?: number;
}

export interface SmokingAreaPhoto {
  id: string;
  smoking_area_id: string;
  photo_url: string;
  uploaded_by?: string;
  created_at: string;
}

export interface LocationLatLong {
  latitude: number;
  longitude: number;
}
