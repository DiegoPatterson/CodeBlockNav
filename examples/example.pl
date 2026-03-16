# BLOCK: Perl Script Example
# Demonstrates block parsing in Perl, a classic scripting language
# Perl uses # for comments

use strict;
use warnings;
use Data::Dumper;

# SUBBLOCK1: Data Processing Functions
# SUBBLOCK2: Text Parsing
sub parse_log_entry {
    my ($line) = @_;
    
    # Extract timestamp, level, and message
    if ($line =~ /\[(\d{4}-\d{2}-\d{2})\]\s+(\w+)\s+(.*)/) {
        return {
            timestamp => $1,
            level => $2,
            message => $3
        };
    }
    return undef;
}

# SUBBLOCK2: Data Transformation
sub transform_user_data {
    my ($users) = @_;
    
    my @transformed;
    foreach my $user (@$users) {
        push @transformed, {
            id => $user->{id},
            name => uc($user->{name}),
            email => lc($user->{email})
        };
    }
    return \@transformed;
}

# SUBBLOCK1: I/O Operations
# SUBBLOCK2: File Reading
sub read_config_file {
    my ($filename) = @_;
    my %config;
    
    open my $fh, '<', $filename or die "Cannot open $filename: $!";
    while (<$fh>) {
        chomp;
        next if /^#/ || /^\s*$/;
        
        if (/^(\w+)\s*=\s*(.*)$/) {
            $config{$1} = $2;
        }
    }
    close $fh;
    
    return \%config;
}

# SUBBLOCK1: Main Program Logic
print "Perl Block Parser Example\n";
print "=" x 40 . "\n";

my @sample_users = (
    { id => 1, name => 'Alice', email => 'ALICE@EXAMPLE.COM' },
    { id => 2, name => 'Bob', email => 'BOB@EXAMPLE.COM' }
);

my $transformed = transform_user_data(\@sample_users);
print Dumper($transformed);
