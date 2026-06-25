import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitCategory } from '../enums/habit-category.enum';
import { HabitFrequency } from '../enums/habit-frequency.enum';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHabitDto {
  @ApiProperty({ example: 'Practice NestJS' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ enum: HabitCategory, example: HabitCategory.CODE })
  @IsEnum(HabitCategory)
  category: HabitCategory;

  @ApiPropertyOptional({ example: 'code' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  icon?: string;

  @ApiPropertyOptional({ enum: HabitFrequency, example: HabitFrequency.DAILY })
  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2, 3, 4, 5],
    description: 'Days of week when the habit is active (0=Sunday, 6=Saturday)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  scheduleDays?: number[];
}
