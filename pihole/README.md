# Pi-hole Website Blocker

Block websites for every device on your local network with [Pi-hole](https://pi-hole.net/).

## Notes on DNS

Please note that Pi-hole uses DNS to block websites, so blocking and unblocking websites
will not happen immediately. Depending on your DNS cache settings, it can take a few minutes
for blocked websites to register.

## Configuration

### Groups

By default Digital Carrot will add all blocked DNS entries to the `digital_carrot` group.
This group name is configurable. If you want to block domains on devices that aren't running
Digital Carrot you can add the `digital_carrot` group to any other client that you'd like
to use. Check out the [Pi-hole documentation](https://docs.pi-hole.net/group_management/example/)
for details on setting up clients and groups.
