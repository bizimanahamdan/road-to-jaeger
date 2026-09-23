import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * SOFTWARE / Git & Linux.
 *
 * The operating environment of every robot: a Linux single-board computer
 * running ROS 2, accessed over SSH, with firmware and configuration under
 * version control. Neither skill is optional.
 */
export const TOOLS_LESSONS: Lesson[] = [
  lesson({
    id: 'tool-01',
    subject: 'tools',
    order: 1,
    title: 'The Terminal and Filesystem',
    difficulty: 'beginner',
    minutes: 35,
    description: 'Shell navigation, files, paths, redirection and pipes - the minimum fluent command set.',
    why: 'A robot runs Linux. You will configure it, debug it and recover it entirely from a terminal, usually over SSH with no display. Comfort here removes friction from every other lesson in this roadmap.',
    objectives: [
      'Navigate and manipulate files and directories from a shell',
      'Use absolute and relative paths, including ~ and ..',
      'Compose commands with pipes and redirection to solve a task in one line',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'The commands you should not have to look up',
        columns: ['Command', 'Purpose', 'Common flags'],
        rows: [
          ['pwd / ls / cd', 'Where am I, what is here, go there', 'ls -la (all files, long format)'],
          ['cp / mv / rm / mkdir', 'Copy, move, delete, create directory', 'rm -r (recursive) - irreversible, no recycle bin'],
          ['cat / less / head / tail', 'Read file contents', 'tail -f (follow a log live)'],
          ['grep / find', 'Search content / search filenames', 'grep -rn (recursive, line numbers)'],
          ['chmod / chown', 'Permissions / ownership', 'chmod +x (make executable)'],
          ['ps / top / kill', 'Running processes', 'ps aux | grep, kill -9'],
          ['df / du', 'Disk free / disk used', 'du -sh * (size of each item)'],
          ['ssh / scp', 'Remote shell / remote copy', 'ssh user@host'],
        ],
      },
      {
        kind: 'formula',
        heading: 'Pipes and redirection',
        formula: 'cmd1 | cmd2      cmd > file      cmd >> file      cmd 2>&1      cmd < file',
        defines: [
          '| sends stdout of the left command to stdin of the right',
          '> overwrites, >> appends',
          '2>&1 merges stderr into stdout so both can be piped or captured',
          'Every stream has a descriptor: 0 stdin, 1 stdout, 2 stderr',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a real debugging one-liner',
        problem: 'Your robot log at /var/log/robot.log is 2 GB. Find the 20 most frequent ERROR lines without opening the file in an editor.',
        solution: [
          'grep ERROR /var/log/robot.log | sort | uniq -c | sort -rn | head -20',
          'grep filters, sort groups identical lines adjacently, uniq -c counts them, sort -rn orders by count descending, head takes the top 20',
          'This pipeline answers "what is actually failing?" in about a second on a file no editor would open',
        ],
        answer: 'grep | sort | uniq -c | sort -rn | head - the single most useful pipeline in Linux debugging',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'rm has no undo',
        body: [
          '`rm -rf` deletes permanently and immediately. A trailing space in `rm -rf /tmp /var` becomes `rm -rf /tmp /var` deleting two directories, and `rm -rf /*` is unrecoverable. Check with `ls` first, use the exact path, and never run a recursive delete with a variable you have not echoed. On a robot in the field, this is how you lose a working configuration.',
        ],
      },
    ],
    resources: [
      R('Linux Journey', 'course', 'https://linuxjourney.com/', { minutes: 480, note: 'Free, structured, browser-based. The best starting point.' }),
      R('The Linux Command Line (William Shotts) - free PDF', 'book', 'https://linuxcommand.org/tlcl.php', { minutes: 1200, note: 'Free complete book. Read chapters 1-11.' }),
      R('OverTheWire: Bandit wargame', 'practice', 'https://overthewire.org/wargames/bandit/', { minutes: 600, note: 'Free. Teaches SSH and shell skills by solving actual levels - the most effective way to learn this.' }),
    ],
    exercises: [
      X('code', 'Complete levels 0 to 10 of OverTheWire Bandit, recording the command you used for each. Summarise which three commands you used most.', 90, { solution: 'Bandit forces real use of ssh, ls, cd, cat, file, grep, find, sort, uniq, base64 and tar. If you reach level 10 you are functionally competent in a shell.' }),
      X('code', 'Create a directory tree three levels deep with 20 files of varying sizes, then: find all files larger than 1 KB, count lines matching a pattern across all of them, and produce a one-line summary of total size. Use only pipes and standard tools.', 30, { solution: 'find . -size +1k; grep -rc pattern . | sort; du -sh . Each task should be one line. If you are writing a script, you are probably missing a pipeline.' }),
    ],
    questions: [
      mcq(1, 'Which command shows the current working directory?', ['pwd', 'cd', 'ls', 'dir'], 0, 'print working directory. `ls` lists contents; `cd` changes directory.'),
      mcq(1, '`cmd1 | cmd2` does what?', ['Sends stdout of cmd1 to stdin of cmd2', 'Runs both simultaneously and merges output', 'Writes cmd1 output to a file named cmd2', 'Runs cmd2 only if cmd1 fails'], 0, 'The pipe connects streams without any temporary file.'),
      mcq(2, 'To append output to a file without overwriting it, use:', ['>>', '>', '2>', '<'], 0, '`>` truncates the file first. Using it by accident destroys the contents.'),
      mcq(2, '`2>&1` means:', ['Redirect stderr to wherever stdout is currently going', 'Redirect stdout to stderr', 'Merge both into a file named 1', 'Discard stderr'], 0, 'Without it, piping a command sends only stdout and error messages escape to the terminal.'),
      mcq(3, 'The pipeline to count occurrences of each unique line, most frequent first, is:', ['sort | uniq -c | sort -rn', 'grep | sort | head', 'uniq -c | sort | head', 'cat | wc -l'], 0, 'sort first is essential - uniq only collapses ADJACENT duplicates.'),
      mcq(3, 'Why is `rm -rf` dangerous?', ['It deletes permanently and immediately, with no recycle bin or undo', 'It is slow', 'It only works as root', 'It requires confirmation each time'], 0, 'Check the path with ls first, and never use an unverified variable in a recursive delete.'),
      short(1, 'Which command follows a log file live as new lines are written?', ['tail -f', 'tail --follow', 'tail -f file'], 'tail -f (or --follow). Indispensable for watching a robot log while it runs.'),
      numeric(2, 'In shell stream numbering, which descriptor is stderr?', 2, '0 is stdin, 1 is stdout, 2 is stderr.'),
    ],
    skills: ['tools-shell'],
  }),

  lesson({
    id: 'tool-02',
    subject: 'tools',
    order: 2,
    title: 'Linux for Robots: Users, Processes, Services and SSH',
    difficulty: 'intermediate',
    minutes: 50,
    prereqs: ['tool-01'],
    description: 'Permissions, process management, systemd services, networking and remote access on an embedded Linux board.',
    why: 'Your robot\'s computer is a Linux single-board machine. It must start your software at boot, keep running when the SSH session closes, be reachable on the network, and let you recover it when something breaks. This lesson is that operational knowledge.',
    objectives: [
      'Interpret and set file permissions and ownership, including the executable bit',
      'Manage processes and keep work running after logout using a service or session manager',
      'Configure SSH access, including key-based authentication and port forwarding',
      'Create a systemd unit that starts robot software at boot and restarts it on failure',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Permissions',
        formula: 'rwxr-xr-- = 754 = owner(rwx) group(r-x) other(r--)      r=4 w=2 x=1',
        defines: [
          'A script needs the executable bit: chmod +x run.sh',
          'Serial ports are device files owned by the `dialout` group - add your user to it to access /dev/ttyUSB0 without sudo',
          'Never run robot software as root; create a dedicated user with only the permissions it needs',
        ],
      },
      {
        kind: 'text',
        heading: 'Processes and surviving logout',
        body: [
          'When an SSH session closes, its child processes receive SIGHUP and die. That is why a robot started manually stops the moment you disconnect. The proper solution is a systemd service, which also gives you automatic restart on crash, log capture to journald, boot ordering and dependency management.',
          'For quick experiments use `tmux` or `screen`: they run a persistent session on the machine that you can detach from and reattach to later. For anything that must run every time the robot starts, write a service unit.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a robot service unit',
        problem: 'Write a systemd unit that runs /home/robot/app/main.py at boot, restarts it if it crashes, and logs to the journal.',
        solution: [
          '[Unit]\nDescription=Road to Jaeger robot stack\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nUser=robot\nWorkingDirectory=/home/robot/app\nExecStart=/home/robot/app/.venv/bin/python /home/robot/app/main.py\nRestart=on-failure\nRestartSec=2\nStandardOutput=journal\nStandardError=journal\n\n[Install]\nWantedBy=multi-user.target',
          'Enable with: sudo systemctl enable --now robot.service',
          'Watch it with: journalctl -u robot.service -f',
          'Restart=on-failure with a 2 second delay recovers from crashes; RestartSec also prevents a restart storm that would flood the log',
        ],
        answer: 'A unit with After=network-online.target, Restart=on-failure and journal logging',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'SSH keys, not passwords',
        body: [
          'A robot on a network with password SSH will be found and attacked - internet-facing devices with default credentials are compromised within minutes. Generate a keypair, install the public key with ssh-copy-id, then disable password authentication in /etc/ssh/sshd_config (PasswordAuthentication no). Keep one console or serial access path open in case you lock yourself out, and change the default username and password on any new board before it touches a network.',
        ],
      },
      {
        kind: 'text',
        heading: 'Recovery paths you must set up in advance',
        body: [
          'A headless robot that fails to boot is unrecoverable without a plan. Before you need it: enable a serial console or keep a USB keyboard and monitor accessible, know how to enter recovery mode on your board, keep a known-good SD card image, and set up a watchdog (hardware or systemd) that power-cycles on a total hang. Test the recovery path once, deliberately, while it is easy.',
        ],
      },
    ],
    resources: [
      R('systemd.service unit configuration', 'docs', 'https://www.freedesktop.org/software/systemd/man/systemd.service.html', { minutes: 45, note: 'The authoritative free reference. Read Restart= and RestartSec= carefully.' }),
      R('journalctl', 'docs', 'https://www.freedesktop.org/software/systemd/man/journalctl.html', { minutes: 25 }),
      R('OpenSSH key-based authentication', 'docs', 'https://www.openssh.com/manual.html', { minutes: 40 }),
      R('Linux permissions', 'article', 'https://linuxjourney.com/lesson/file-permissions', { minutes: 20 }),
    ],
    exercises: [
      X('code', 'Write and install a systemd service for a long-running script of your own. Verify: it starts at boot, restarts when you kill it, and its output appears in journalctl. Then add RestartSec and confirm the restart delay is respected.', 60, { solution: 'Test the crash path deliberately with `kill -9 $(pgrep -f main.py)` and watch journald. If Restart= is missing, the service stays dead - which is the failure you are testing for.' }),
      X('code', 'Configure key-based SSH to a board or VM and disable password authentication. Confirm you can still connect with the key, then confirm a password attempt is refused. Document your recovery path if the key is lost.', 45, { solution: 'Keep a second access path (console, serial, or a second authorised key) BEFORE disabling passwords. Locking yourself out of a headless robot requires physical access and an SD card reflash.' }),
      X('question', 'Your robot\'s software stops whenever you close the SSH session. Give two fixes, and explain which is correct for production and why.', 20, { solution: 'tmux/screen keeps it running interactively - good for experiments. A systemd service is correct for production: it survives logout AND reboots, restarts on crash, orders itself after the network, and logs to the journal. tmux gives you none of the reboot or restart behaviour.' }),
    ],
    questions: [
      mcq(1, 'The permission mode 754 means:', ['Owner rwx, group r-x, other r--', 'Everyone can read, write and execute', 'Owner r--, group rwx, other r-x', 'No one can execute'], 0, '7 = 4+2+1 (rwx), 5 = 4+1 (r-x), 4 = r--.'),
      mcq(1, 'To run a shell script directly you must:', ['Set the executable bit with chmod +x', 'Rename it to .exe', 'Run it as root', 'Move it to /bin'], 0, 'Without the x bit the shell refuses to execute it, regardless of its contents.'),
      mcq(2, 'Accessing /dev/ttyUSB0 without sudo typically requires:', ['Membership in the dialout group', 'Root access always', 'A systemd service', 'Changing the baud rate'], 0, 'sudo usermod -aG dialout $USER, then re-login. Group membership is the correct fix; running as root is not.'),
      mcq(2, 'Software started manually over SSH dies when the session closes because:', ['Child processes receive SIGHUP on logout', 'SSH kills all processes deliberately', 'The network interface goes down', 'systemd stops them'], 0, 'Use a service for production or tmux for interactive work.'),
      mcq(3, 'In a systemd unit, `Restart=on-failure` with `RestartSec=2` provides:', ['Automatic recovery from crashes, with a delay that prevents a restart storm', 'Faster startup', 'Log rotation', 'Network recovery'], 0, 'Without RestartSec a crash loop can produce thousands of restarts per minute and fill the disk with logs.'),
      mcq(3, 'Why disable SSH password authentication on a networked robot?', [
        'Password-based SSH on an exposed device is typically found and attacked within minutes',
        'Keys are shorter to type',
        'Passwords cannot be used over SSH',
        'It reduces CPU load',
      ], 0, 'Also change default credentials on any new board before it reaches a network. Keep a recovery path open first.'),
      mcq(4, 'Which unit directive ensures robot software waits for network availability?', ['After=network-online.target', 'Requires=network.target', 'Wants=ssh.service', 'Before=multi-user.target'], 0, 'After= orders startup. Pair it with Wants=network-online.target so the target is actually pulled in.'),
      short(2, 'Which command shows live logs for a specific systemd service?', ['journalctl -u service -f', 'journalctl -fu service', 'journalctl -u robot.service -f'], 'journalctl -u <service> -f. Add --since "10 min ago" to bound the output.'),
    ],
    skills: ['tools-linux', 'tools-systemd', 'tools-ssh'],
  }),

  lesson({
    id: 'tool-03',
    subject: 'tools',
    order: 3,
    title: 'Git Fundamentals: Repository, Commit, History',
    difficulty: 'beginner',
    minutes: 45,
    description: 'The Git object model, staging, committing, inspecting history and undoing mistakes.',
    why: 'Robot projects have long lifetimes and many interacting parts. Without version control you cannot answer "what changed since it last worked?" - which is the most important debugging question there is. Git is also how every open-source robotics project you will read is distributed.',
    objectives: [
      'Explain the three areas of a Git repository: working tree, index and commit history',
      'Stage, commit, inspect and navigate history with confidence',
      'Undo changes at each level safely, and state which operations lose work',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Three areas, and why the index exists',
        body: [
          'The WORKING TREE is your files as they are now. The INDEX (staging area) is the snapshot you are assembling for the next commit. The HISTORY is the chain of commits, each referencing its parent and containing a full snapshot of the tree.',
          'The index exists so you can commit a subset of your changes. You edited four files but only two relate to the bug you are fixing: stage those two, commit them, then handle the others. That discipline is what makes history readable - and readable history is what makes `git bisect` and `git log -p` powerful debugging tools.',
        ],
      },
      {
        kind: 'table',
        heading: 'The core command set',
        columns: ['Task', 'Command'],
        rows: [
          ['See what changed', 'git status, git diff (unstaged), git diff --staged'],
          ['Record work', 'git add <paths>, git commit -m "message"'],
          ['Read history', 'git log --oneline --graph --decorate, git show <sha>'],
          ['Inspect one file\'s history', 'git log -p <file>, git blame <file>'],
          ['Discard unstaged changes', 'git restore <file>  (DESTRUCTIVE)'],
          ['Unstage without discarding', 'git restore --staged <file>  (safe)'],
          ['Amend the last commit', 'git commit --amend  (rewrites history)'],
          ['Compare two commits', 'git diff <sha1> <sha2>'],
        ],
      },
      {
        kind: 'formula',
        heading: 'A commit message that is useful in six months',
        formula: 'Imperative subject under about 50 characters, blank line, then body explaining WHY',
        defines: [
          '"Fix encoder overflow in odometry" not "fixed stuff"',
          'The body records the reasoning and the evidence: what broke, how you found it, what the fix does',
          'Reference the symptom, not just the file - future you will search by symptom',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Know which commands destroy work',
        body: [
          'Destructive: `git restore <file>` (discards uncommitted changes), `git reset --hard` (discards commits and changes), `git clean -fd` (deletes untracked files), `git push --force` (overwrites shared history). Safe alternatives exist for most: `git stash` preserves work you are not ready to commit, and `git reset --soft` moves the branch pointer while keeping your changes staged. Before any destructive command, run `git stash` or make a branch - recovery from a lost commit is possible via `git reflog` for a while, but only if you know to look.',
        ],
      },
    ],
    resources: [
      R('Pro Git (Scott Chacon and Ben Straub) - complete free book', 'book', 'https://git-scm.com/book/en/v2', { minutes: 900, note: 'The definitive free reference. Chapters 1-3 are the minimum; chapter 7 (tools) is worth reading twice.' }),
      R('Learn Git Branching', 'simulator', 'https://learngitbranching.js.org/', { minutes: 120, note: 'Free interactive visualisation. The fastest way to build a correct mental model.' }),
      R('Oh Shit, Git!?! - recovering from mistakes', 'article', 'https://ohshitgit.com/', { minutes: 20, note: 'Free, blunt, and covers exactly the recovery commands you need in a panic.' }),
    ],
    exercises: [
      X('code', 'Initialise a repository, make five commits touching different files, then: view the graph, find which commit introduced a specific line with git log -S, revert one commit, and recover it with git reflog.', 45, { solution: 'git log -S "text" finds commits that changed the number of occurrences of a string - a genuinely powerful search. git reflog lists where HEAD has been, so a "lost" commit is almost always recoverable for weeks.' }),
      X('code', 'Write a .gitignore for a robotics project that excludes: build outputs, Python caches and venvs, ROS log and build directories, editor files, secrets and .env files, and large recorded bag files. Explain each entry.', 30, { solution: 'Must include: __pycache__/, *.pyc, .venv/, build/, install/, log/, .vscode/, *.swp, .env, *.bag, *.mcap, *.stl only if generated. Committing secrets or multi-gigabyte bag files is a real and common mistake - the latter makes a repository unusable.' }),
      X('question', 'You committed a password in a config file two commits ago and have not pushed. Describe the safe recovery, and explain what changes if you HAVE pushed to a shared remote.', 20, { solution: 'Not pushed: rewrite the two commits (interactive rebase or filter-repo) and commit the corrected config, keeping the real secret out of history. Pushed to a shared remote: rewriting history is disruptive and the secret must be treated as COMPROMISED - rotate the credential regardless of whether you scrub history, because anyone may have already cloned it. Scrubbing history is not a substitute for rotating a leaked secret.' }),
    ],
    questions: [
      mcq(1, 'The Git index (staging area) exists so that:', ['You can commit a subset of your working tree changes', 'Commits are faster', 'History is encrypted', 'Branches can be created'], 0, 'It lets you assemble a coherent commit rather than dumping every edit into one.'),
      mcq(1, '`git diff` with no arguments shows:', ['Unstaged changes (working tree versus index)', 'Staged changes', 'Differences between branches', 'The last commit only'], 0, 'Use `git diff --staged` to see what will actually be committed - check this before every commit.'),
      mcq(2, 'Which command discards uncommitted changes to a file and CANNOT be undone?', ['git restore <file>', 'git restore --staged <file>', 'git stash', 'git log'], 0, '`git stash` is the safe alternative: it preserves the work and can be reapplied later.'),
      mcq(2, 'A good commit message subject line is:', ['Imperative and specific: "Fix encoder overflow in odometry"', 'Descriptive past tense: "Fixed some stuff"', 'A filename', 'As long as needed to explain everything'], 0, 'Imperative mood matches what the commit does when applied. The body carries the reasoning.'),
      mcq(3, 'You ran `git reset --hard` and lost a commit. Which command can usually recover it?', ['git reflog', 'git status', 'git diff', 'git clean'], 0, 'The reflog records where HEAD has been. Recovery is usually possible for weeks, but only if you know to look.'),
      mcq(3, 'You pushed a secret to a shared remote and then scrubbed it from history. What is still required?', [
        'Rotate the credential - it must be treated as compromised regardless of the scrub',
        'Nothing, the scrub removed it',
        'Force-push again',
        'Delete the repository',
      ], 0, 'Anyone may have cloned it before the scrub. Scrubbing history limits exposure; rotating removes it.'),
      mcq(2, 'Which files should a robotics .gitignore exclude?', [
        'Build outputs, virtual environments, ROS log directories, secrets and large recorded data bags',
        'Source code and README',
        'Only .env files',
        'Nothing - commit everything',
      ], 0, 'Committing multi-gigabyte bag files makes a repository unusable for everyone who clones it.'),
      short(1, 'Which command shows a compact branch graph of history?', ['git log --oneline --graph', 'git log --graph --oneline --decorate', 'git log --oneline --graph --decorate'], 'git log --oneline --graph --decorate, usually aliased. It is the view you will use most.'),
    ],
    skills: ['tools-git'],
  }),

  lesson({
    id: 'tool-04',
    subject: 'tools',
    order: 4,
    title: 'Branching, Merging and Conflict Resolution',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['tool-03'],
    description: 'Branch strategy, merge versus rebase, resolving conflicts correctly and bisecting to find a regression.',
    why: 'Experimental changes on a robot must not break the version that works. Branching is how you try a new controller while keeping a known-good state one command away. And `git bisect` is the most powerful debugging tool in this entire roadmap.',
    objectives: [
      'Create and integrate branches, and choose between merge and rebase with justification',
      'Resolve a merge conflict correctly by understanding both sides, not by picking one at random',
      'Use git bisect to locate the commit that introduced a regression',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Merge preserves history; rebase rewrites it',
        body: [
          '`git merge` joins two branches and creates a merge commit, preserving exactly when work diverged and rejoined. `git rebase` replays your commits onto the target branch, producing a straight line but rewriting commit hashes.',
          'The rule that prevents disasters: never rebase commits that someone else has already pulled. Rebasing your own local feature branch before merging is normal and keeps history clean. Rebasing a shared branch forces everyone to reconcile divergent histories by hand.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Conflict resolution procedure',
        formula: 'git merge -> conflict -> open the file -> understand BOTH sides -> write the correct combined result -> git add -> git commit',
        defines: [
          '<<<<<<< HEAD is your side; ======= separates; >>>>>>> branch is theirs',
          'A conflict is a request for a human decision, not an error to eliminate',
          'Never resolve a conflict by deleting one side without reading it - you will silently revert someone\'s fix',
          'git mergetool or an editor with 3-way merge support shows the base version too, which is often decisive',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - git bisect finds a regression',
        problem: 'The robot tracked a line correctly two weeks and 40 commits ago, and now oscillates. Find the commit that broke it.',
        solution: [
          'git bisect start; git bisect bad HEAD; git bisect good <sha from two weeks ago>',
          'Git checks out the midpoint. You run the SAME test each time - ideally automated: a script that runs the simulator and reports pass/fail',
          'git bisect good or git bisect bad; Git halves the remaining range each time',
          'After about 6 steps (log2(40) = 5.3) you have the exact commit that introduced the regression',
          'git bisect reset returns you to where you started. With `git bisect run ./test.sh` the whole process is automatic',
        ],
        answer: 'About 6 automated tests identify the exact commit - versus days of manual guessing',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Bisect only works if each commit is testable',
        body: [
          'This is the strongest practical argument for small, frequent, working commits. If half your commits are broken intermediate states, bisect points at the wrong thing. Commit when the tree builds and tests pass, even mid-feature - and if a commit is genuinely experimental, keep it on a branch rather than on the mainline you will bisect.',
        ],
      },
    ],
    resources: [
      R('Pro Git: branching and rebasing', 'book', 'https://git-scm.com/book/en/v2/Git-Branching-Rebasing', { minutes: 60, note: 'Free. Read the "perils of rebasing" section carefully.' }),
      R('git bisect', 'docs', 'https://git-scm.com/docs/git-bisect', { minutes: 30 }),
      R('Learn Git Branching', 'simulator', 'https://learngitbranching.js.org/', { minutes: 90 }),
    ],
    exercises: [
      X('code', 'Create a repository with two branches that modify the same lines of the same file, merge them, and resolve the conflict correctly. Then demonstrate that resolving by keeping only one side silently loses the other branch\'s work.', 40, { solution: 'The correct resolution usually combines both intents - for example keeping one branch\'s new parameter and the other\'s bounds check. Read both sides and the base version before writing anything.' }),
      X('code', 'Create 32 commits where the 20th introduces a bug detectable by a script. Use git bisect run with that script to find it automatically, and confirm the reported commit is the 20th.', 45, { solution: 'The script must exit 0 for good and non-zero for bad (exit 125 to mark a commit as untestable/skip). This exercise demonstrates why an automated test makes bisect trivially powerful.' }),
      X('question', 'Explain when you would choose merge over rebase, and state the one situation where rebasing is never acceptable.', 15, { solution: 'Choose merge when the divergence itself is meaningful history (long-lived feature work, integration points) or when commits are already shared. Rebase is never acceptable on commits others have pulled from a shared branch - it rewrites hashes and forces every collaborator to reconcile divergent history manually.' }),
    ],
    questions: [
      mcq(1, '`git rebase` differs from `git merge` in that it:', ['Rewrites commit hashes to produce a linear history', 'Creates a merge commit', 'Cannot be undone', 'Only works on the main branch'], 0, 'Linear history is cleaner; the cost is that rewritten commits are different objects.'),
      mcq(1, 'The golden rule of rebasing is:', ['Never rebase commits that others have already pulled', 'Always rebase before merging', 'Never rebase your own local branch', 'Rebase only on weekends'], 0, 'Rebasing your own unpushed work is routine. Rebasing shared history breaks everyone else.'),
      mcq(2, 'In a conflict marker, `<<<<<<< HEAD` denotes:', ['Your current branch side of the conflict', 'The incoming side', 'The common ancestor', 'A syntax error'], 0, 'Theirs appears after >>>>>>>. A 3-way merge tool also shows the base version, which often decides the answer.'),
      mcq(2, 'The correct way to resolve a conflict is to:', ['Understand both sides and write the correct combined result', 'Keep your side and discard theirs', 'Keep their side and discard yours', 'Delete the conflicting section'], 0, 'Discarding a side without reading it silently reverts someone\'s fix - one of the most damaging mistakes in collaboration.'),
      mcq(3, 'git bisect locates a regression in approximately how many steps for 64 candidate commits?', ['6', '64', '32', '1'], 0, 'Binary search: log2(64) = 6. Each step requires one test run.'),
      mcq(3, 'For git bisect to give a correct answer, each commit in the range must be:', ['Testable - ideally with an automated pass/fail script', 'Rebased', 'Signed', 'Merged from a feature branch'], 0, 'Broken intermediate commits mislead bisect. This is the practical case for small, working commits.'),
      mcq(3, 'In `git bisect run ./test.sh`, what does exit code 125 mean?', ['Skip this commit - it cannot be tested', 'The commit is bad', 'The commit is good', 'Stop the bisect'], 0, '0 means good, 1-124 (except 125) means bad, 125 means skip. Useful for commits that do not build.'),
      short(2, 'Which command abandons an in-progress bisect and returns you to the original commit?', ['git bisect reset', 'git bisect reset'], 'git bisect reset. Forgetting it leaves you on a detached HEAD, which is confusing but harmless.'),
    ],
    skills: ['tools-git-branching', 'tools-bisect'],
  }),

  lesson({
    id: 'tool-05',
    subject: 'tools',
    order: 5,
    title: 'Remotes, Pull Requests and Collaboration',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['tool-04'],
    description: 'Working with remotes, contributing to open source, and a solo workflow that still gets the benefits.',
    why: 'Every robotics library you will use is on GitHub, and contributing a fix is the fastest way to learn a codebase deeply. Even working alone, a remote gives you backup, history and the ability to build on another machine - and CI can build your Android APK for you.',
    objectives: [
      'Manage remotes, fetch, pull, push and explain what each does to your local history',
      'Contribute a change to an external repository via fork, branch and pull request',
      'Describe a solo workflow that still provides backup, review and automation benefits',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Fetch versus pull',
        formula: 'git fetch = download remote commits, change nothing locally      git pull = git fetch + integrate into the current branch',
        defines: [
          'Pull integrates immediately, which can create a merge commit or a conflict you were not expecting',
          'The safer habit: fetch, inspect with `git log HEAD..origin/main`, then merge or rebase deliberately',
          'git push -u origin <branch> sets the upstream so later pushes need no arguments',
        ],
      },
      {
        kind: 'text',
        heading: 'Contributing to a project you do not own',
        body: [
          'Fork the repository, add your fork as a remote, create a branch from an up-to-date main, make one focused change, add or update a test, and open a pull request describing the problem, your approach and how you verified it. Keep the branch small: a 30-line fix is reviewed in hours, a 900-line rewrite is reviewed in weeks or never.',
          'Read the project\'s CONTRIBUTING guide and match its code style exactly. For ROS 2 and most robotics projects that means following their linter configuration and adding tests - a fix without a test is usually rejected because the maintainer cannot verify it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Solo does not mean no remote',
        body: [
          'An SD card fails, a laptop is lost, and a repository with no remote is gone. Push every session. A remote also enables continuous integration: a GitHub Actions workflow can run your tests on every push and build your Android APK automatically, which is exactly how this project produces its APK. Set that up early - it costs an hour and saves the project.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - recovering a corrupted local repository',
        problem: 'Your laptop\'s repository directory is damaged. How do you get back to work in minutes?',
        solution: [
          'git clone <remote-url> - the entire history, every branch and every tag comes down',
          'Recreate the environment: install dependencies from the lockfile, restore .env from your secret store (never from Git)',
          'Any uncommitted work is lost - which is the real lesson: commit and push often, because the cost is a few seconds and the benefit is total',
          'If you had stashes or local-only branches, they are gone too. This is why `git push --all` before risky experiments is a habit worth having',
        ],
        answer: 'A fresh clone plus dependency reinstall - provided everything was pushed',
      },
    ],
    resources: [
      R('Pro Git: working with remotes', 'book', 'https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes', { minutes: 40 }),
      R('GitHub docs: about pull requests', 'docs', 'https://docs.github.com/en/pull-requests', { author: 'GitHub', minutes: 45 }),
      R('GitHub Actions documentation', 'docs', 'https://docs.github.com/en/actions', { author: 'GitHub', minutes: 60, note: 'Free CI. Used by this project to build the Android APK.' }),
    ],
    exercises: [
      X('code', 'Set up a remote for a project, push all branches and tags, then delete the local clone and restore it fully from the remote. Verify the restored history matches (compare git log hashes).', 35, { solution: 'If hashes match, everything essential survived. Note what did NOT: uncommitted changes, stashes, untracked files and .env. That gap is your backup policy.' }),
      X('code', 'Find a small documentation or typo issue in an open-source robotics project, fork it, fix it on a branch, and open a pull request with a clear description. If you are not ready for that, prepare the branch locally and write the PR description.', 60, { solution: 'The description should state: what was wrong, why it matters, what you changed, and how you verified it. Maintainers review PRs with that structure far faster.' }),
      X('question', 'Explain why `git fetch` then inspecting is safer than `git pull`, and give a situation where pull causes real damage.', 15, { solution: 'Pull integrates immediately; if the remote has diverged you get an unexpected merge commit or conflicts mid-task, possibly with uncommitted local changes present. Damage case: pulling into a dirty working tree can fail partway, leaving you with a mix of states. Fetch first, look at what is coming, then integrate deliberately.' }),
    ],
    questions: [
      mcq(1, '`git fetch` differs from `git pull` because fetch:', ['Downloads remote commits without integrating them into your branch', 'Merges immediately', 'Pushes your commits', 'Only works on tags'], 0, 'Pull is fetch plus integrate. Fetching first lets you inspect before committing to a merge.'),
      mcq(1, 'What does `git push -u origin feature` do?', ['Pushes the branch and records it as tracking origin/feature', 'Only pushes the first time', 'Creates the branch locally', 'Deletes the remote branch'], 0, 'Afterwards, plain `git push` and `git pull` know which remote branch to use.'),
      mcq(2, 'The first step in contributing to a repository you do not own is:', ['Fork it and create a branch from an up-to-date main', 'Commit directly to main and push', 'Open an issue demanding the change', 'Rewrite the module'], 0, 'You have no write access to the upstream, and a focused branch keeps the change reviewable.'),
      mcq(2, 'Which pull request is most likely to be reviewed quickly?', ['A small focused change with a test and a clear description', 'A large rewrite of several modules', 'A change with no description', 'A change to build configuration only'], 0, 'Review effort scales superlinearly with change size. Small PRs get merged; large ones stall.'),
      mcq(3, 'Why should a solo developer still push to a remote every session?', [
        'Local storage fails, and CI on the remote can run tests and build artifacts like an Android APK',
        'Git requires a remote to function', 'It makes commits faster', 'It is only needed for collaboration'], 0, 'Backup plus automation. This project uses a GitHub Actions workflow to build its APK for exactly this reason.'),
      mcq(3, 'After a laptop failure, what is NOT recoverable from a fresh clone?', ['Uncommitted changes, stashes, untracked files and .env secrets', 'Commit history', 'Tags', 'Remote branches'], 0, 'Which is why secrets live outside Git and why you commit and push often.'),
      short(1, 'Which command lists your configured remotes with their URLs?', ['git remote -v', 'git remote --verbose', 'git remote -v'], 'git remote -v shows each remote name with its fetch and push URLs.'),
      numeric(3, 'A collaborator has pushed 8 commits while you made 5 locally on the same branch. How many commits exist in total before integration (assuming no shared ones)?', 13, '8 + 5 = 13 distinct commits that a merge must reconcile.', { unit: 'commits' }),
    ],
    skills: ['tools-remotes', 'tools-collaboration'],
  }),
];
