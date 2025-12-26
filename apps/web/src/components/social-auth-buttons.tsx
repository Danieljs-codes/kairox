import IconGithub from '@icons/github.svg';
import IconGoogle from '@icons/google.svg';
import { Button } from '@ui/button';
import { Separator } from '@ui/separator';

export function SocialAuthButtons() {
	return (
		<>
			<div className="flex items-center gap-3">
				<Separator className="my-3 flex-1" />
				<p className="text-sm text-muted-foreground whitespace-nowrap">Or continue with</p>
				<Separator className="my-3 flex-1" />
			</div>
			<div className="flex items-center gap-x-2">
				<Button className="flex-1" variant="outline" size="lg">
					<IconGithub />
					Sign in with Github
				</Button>
				<Button className="flex-1" variant="outline" size="lg">
					<IconGoogle />
					Sign in with Google
				</Button>
			</div>
		</>
	);
}
