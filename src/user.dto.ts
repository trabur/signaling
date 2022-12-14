import { IsUUID, IsString, Length, MaxLength, IsAlphanumeric, IsOptional, IsBoolean, IsDate, IsUrl, IsEnum } from 'class-validator';

enum Colors {
  Red,
  Orange,
  Yellow,
  Green,
  Blue, // individuals
  Purple,
  Gold, // companies
  Grey, // government accounts
  White,
  Black,
}

export default class UserDto {
  @IsString()
  @IsUUID("4")
  @IsOptional()
  id: string;

  @IsBoolean()
  @IsOptional()
  checkmark: boolean;

  @IsEnum(Colors)
  @IsOptional()
  plan: Colors

  @IsString()
  @IsAlphanumeric()
  @Length(3, 21)
  username: string;

  @IsString()
  @Length(1, 32)
  displayName: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  photo: string;

  @IsString()
  @IsOptional()
  @MaxLength(420)
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  url: string;

  @IsString()
  @Length(1, 128)
  firebaseId: string;

  @IsString()
  @IsOptional()
  @Length(1, 256)
  peerId: string;

  @IsString()
  @IsOptional()
  @IsDate()
  createdAt: string;
}