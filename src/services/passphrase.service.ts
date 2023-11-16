import { User } from "../model/user";
import { FindOptionsOrderValue } from "typeorm";
import { PassphraseLocation, Passphrase } from "../model/passphrase";

export class PassphraseService {
  async findOne(sub: string, passphraseId: string) {
    return await Passphrase.findOne({
      where: { id: passphraseId, user: { sub } },
      relations: { user: true },
    });
  }

  async findAll(sub: string, dir: FindOptionsOrderValue = "DESC") {
    return await Passphrase.find({
      where: { user: { sub } },
      relations: { user: true },
      order: {
        createdAt: dir,
      },
    });
  }

  async create(sub: string, id: string, location: PassphraseLocation) {
    const user = await User.findOneByOrFail({ sub });
    const passphrase = new Passphrase();
    passphrase.id = id;
    passphrase.location = location;
    passphrase.user = user;
    const { id: passphraseId } = await passphrase.save();
    return { passphraseId };
  }
}
