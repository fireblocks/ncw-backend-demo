import { User } from "../model/user";

export class UserService {
  async findOrCreate(sub: string) {
    let user: User | null;

    user = await User.findOneBy({ sub });
    if (!user) {
      user = new User();
      user.sub = sub!;
      await user.save();
    }
    return user;
  }
}
