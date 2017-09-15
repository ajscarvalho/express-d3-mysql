
CREATE DATABASE chart_test;

GRANT ALL ON chart_test.* TO chart_user@localhost IDENTIFIED BY 'chart_user';

use chart_test;

create table data_series (
    id bigint auto_increment,
    series_name varchar(80) not null,
    primary key(id),
    unique(series_name)
);

create table data_point (
    id bigint auto_increment,
    ts timestamp not null,
    data_series_id bigint not null,
    value float not null,
    primary key(id),
    constraint foreign key (data_series_id) references data_series(id)
);


