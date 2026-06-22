import { Share } from 'react-native';
import { addFriend, findUserByInviteCode } from './userService';

export async function shareInvite(inviteCode: string, displayName: string): Promise<void> {
  await Share.share({
    message: `${displayName} invites you to Swish Streak! Use code ${inviteCode} or open swishstreak://invite/${inviteCode}`,
  });
}

export async function shareArcadeScore(
  displayName: string,
  score: number,
  streak: number,
  inviteCode?: string
): Promise<void> {
  const inviteLine = inviteCode ? `\nJoin me with code ${inviteCode} or swishstreak://invite/${inviteCode}` : '';
  await Share.share({
    message: `${displayName} scored ${score} on Swish Streak! Best streak: ${streak}. Can you beat it?${inviteLine}\nPlay: swishstreak://play`,
  });
}

export async function acceptInviteCode(
  currentUid: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const friend = await findUserByInviteCode(code.trim().toUpperCase());
  if (!friend) {
    return { success: false, message: 'Invite code not found' };
  }
  if (friend.uid === currentUid) {
    return { success: false, message: 'You cannot add yourself' };
  }
  await addFriend(currentUid, friend.uid);
  return { success: true, message: `Added ${friend.displayName} as a friend!` };
}

export function parseInviteCodeFromUrl(url: string): string | null {
  const match = url.match(/invite\/([A-Z0-9]{6})/i);
  return match ? match[1].toUpperCase() : null;
}
