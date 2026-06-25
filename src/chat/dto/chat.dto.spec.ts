import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { ChatDto } from './chat.dto';

describe('ChatDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const metadata: ArgumentMetadata = { type: 'body', metatype: ChatDto };

  it('preserves a valid chat payload when whitelist validation is enabled', async () => {
    await expect(
      pipe.transform({ message: 'Help me plan today', include_context: true }, metadata),
    ).resolves.toEqual(expect.objectContaining({ message: 'Help me plan today', include_context: true }));
  });

  it('rejects a payload without a message', async () => {
    await expect(pipe.transform({ include_context: true }, metadata)).rejects.toBeInstanceOf(BadRequestException);
  });
});
