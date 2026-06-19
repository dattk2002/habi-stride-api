import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitCategory } from '../enums/habit-category.enum';
import { HabitFrequency } from '../enums/habit-frequency.enum';

export class CreateHabitDto {
  @ApiProperty({ example: 'Practice NestJS' })
  name: string;

  @ApiProperty({ enum: HabitCategory, example: HabitCategory.CODE })
  category: HabitCategory;

  @ApiPropertyOptional({ example: 'code' })
  icon?: string;

  @ApiPropertyOptional({ enum: HabitFrequency, example: HabitFrequency.DAILY })
  frequency?: HabitFrequency;
}
