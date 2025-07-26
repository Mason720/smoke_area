/*
  # Smoking Areas Database Schema

  1. New Tables
    - `smoking_areas`
      - `id` (uuid, primary key)
      - `name` (text, smoking area name)
      - `address` (text, full address)
      - `latitude` (double precision, location coordinate)
      - `longitude` (double precision, location coordinate)
      - `description` (text, optional description)
      - `facilities` (jsonb, facilities information)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_verified` (boolean, admin verification status)
    
    - `smoking_area_photos`
      - `id` (uuid, primary key)
      - `smoking_area_id` (uuid, foreign key)
      - `photo_url` (text, Supabase storage URL)
      - `uploaded_by` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read all data
    - Add policies for authenticated users to insert their own data
    - Add policies for users to update their own contributed data

  3. Storage
    - Create storage bucket for smoking area photos
    - Enable public access for photo viewing
*/

-- Create smoking_areas table
CREATE TABLE IF NOT EXISTS smoking_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  description text DEFAULT '',
  facilities jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_verified boolean DEFAULT false
);

-- Create smoking_area_photos table
CREATE TABLE IF NOT EXISTS smoking_area_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smoking_area_id uuid REFERENCES smoking_areas(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE smoking_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE smoking_area_photos ENABLE ROW LEVEL SECURITY;

-- Policies for smoking_areas
CREATE POLICY "Anyone can view smoking areas"
  ON smoking_areas
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert smoking areas"
  ON smoking_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own smoking areas"
  ON smoking_areas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policies for smoking_area_photos
CREATE POLICY "Anyone can view smoking area photos"
  ON smoking_area_photos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert photos"
  ON smoking_area_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own photos"
  ON smoking_area_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS smoking_areas_location_idx ON smoking_areas USING btree (latitude, longitude);
CREATE INDEX IF NOT EXISTS smoking_areas_created_by_idx ON smoking_areas USING btree (created_by);
CREATE INDEX IF NOT EXISTS smoking_area_photos_area_id_idx ON smoking_area_photos USING btree (smoking_area_id);

-- Insert some sample data
INSERT INTO smoking_areas (name, address, latitude, longitude, description, facilities, is_verified) VALUES
  ('Yonghe District Smoking Area', 'No. 2, Lane 96, Section 1, Xiulang Rd, Yonghe District, New Taipei City, Taiwan', 25.0120, 121.5064, 'Designated smoking area near the main entrance', '{"covered": true, "seating": true, "ashtray": true}', true),
  ('Taipei 101 Smoking Zone', 'Taipei 101, Xinyi District, Taipei, Taiwan', 25.0330, 121.5654, 'Outdoor smoking area with good ventilation', '{"covered": false, "seating": false, "ashtray": true}', true),
  ('Ximending Smoking Section', 'Ximending, Wanhua District, Taipei, Taiwan', 25.0442, 121.5090, 'Quiet smoking area away from main crowds', '{"covered": true, "seating": true, "ashtray": true}', true);